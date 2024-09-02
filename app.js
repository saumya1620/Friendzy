const express = require('express')
const multer = require('multer')
const socketio = require('socket.io');
const path = require('path')
const cookieParser = require('cookie-parser')
const app = express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,'public')))
app.use(cookieParser())
app.set('view engine','ejs')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const usermodel = require('./models/user')
const postmodel = require('./models/post')
const requestmodel = require('./models/requests')
const Message = require('./models/message')
const Conversation = require('./models/conversation')
const mongoose = require('mongoose')
const { verify } = require('crypto')
const http = require('http');
const server = http.createServer(app);
const axios = require('axios');
const dotenv = require('dotenv').config();
const secret = 'your_jwt_secret_key';
const io = socketio(server);

//heading : socket 

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('sendMessage', async (data) => {
        const { conversationId, content } = data;
        const newMessage = new Message({
            conversation: conversationId,
            sender: socket.user.id, // Ensure the user is authenticated
            content
        });
        await newMessage.save();
        await Conversation.findByIdAndUpdate(conversationId, {
            $push: { messages: newMessage._id }
        });

        io.to(conversationId).emit('receiveMessage', newMessage); // Emit the message to all users in the conversation
    });

    socket.on('joinConversation', (conversationId) => {
        socket.join(conversationId);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

//heading : multer

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

//heading : for cookies

function verifyToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.redirect('/login');
        }
        req.user = decoded; 
        next();
    });
}

//heading : main page for account creation 

app.get('/',(req,res)=>
{
    res.render('index')
})
app.post('/create',async (req,res)=>
{
    let { username, email, phonenumber, password, confirmPassword, gender, date } = req.body;
    let usercreated = await usermodel.findOne({username})
    
    if(usercreated) 
    {
        return res.redirect('/?exists=true'); 
    }
    if(password.length<6)
    {
        return res.redirect('/?length=true');
    }
    if(phonenumber.length<10)
    {
        return res.redirect('/?phone=true')
    }
    const saltrounds = 10
    bcrypt.genSalt(saltrounds,(err,salt)=>
    {
        bcrypt.hash(password,salt,async (err,hash)=>
        {
            usercreated = await usermodel.create ({
                username,
                email,
                phonenumber,
                password:hash,
                gender,
                date

            })
            console.log(usercreated)
            return res.redirect('/setprofile?welcome=true')
            
            
        })
         
    })
    
})

//heading : for setting profile picture (not working)

app.get('/setprofile', (req, res) => {
    res.render('setprofile');
});


app.post('/uploadProfilePicture', verifyToken, upload.single('profilePicture'), async (req, res) => {
    const userId = req.user.id;
    const profilePicturePath = req.file ? req.file.path : '/images/user.png';

    await usermodel.findByIdAndUpdate(userId, { profilePicture: profilePicturePath });

    res.redirect('/profile');
});

//heading : login page

app.get('/login',(req,res)=>
{
    res.render('login')
})

app.post('/login', async (req,res) => {
    let user = await usermodel.findOne({username: req.body.username})
    console.log(user)
    if(!user) res.redirect('/?incorrect=true');

    bcrypt.compare(req.body.password, user.password, (err, result)=>{
        if(result){
            // let token = jwt.sign({email: user.email}, "secretKey")
            let token = jwt.sign({ id: user._id, username: user.username }, secret);
            res.cookie('token', token, { httpOnly: true})
            
            res.status(200).render('profile',{user})
        }
        else
        {
            res.redirect('/?incorrect=true'); 

        }
    })
})

//heading : this is main page 

app.get('/profile',verifyToken, async (req,res)=>
{
    const user = await usermodel.findById(req.user.id).populate('friends')
    .populate('friends', 'username profilePicture')
    .populate('friendRequests', 'username profilePicture')
    .populate('suggestions', 'username profilePicture');
    let suggestions = await usermodel.find({ _id: { $ne: req.user.id } })
    suggestions = suggestions.filter(suggestion => 
        !user.friends.some(friend => friend._id.equals(suggestion._id))
    );
    const posts = await postmodel.find({ author: req.user.id })
    res.render('profile', { user,posts,suggestions});

})

app.get('/profile/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await usermodel.findById(userId).populate('friends').exec();
        const posts = await postmodel.find({ author: userId }).sort({ createdAt: -1 });
        const currentUserId = req.user ? req.user._id : null; // Assuming req.user contains the logged-in user's data
        
        res.render('userprofile', { user, currentUserId,posts });
    } catch (error) {
        res.status(500).send('Server error');
    }
});

//heading : explore page

app.get('/exploremore',verifyToken,async(req,res)=>
{
    
    const user = await usermodel.findById(req.user.id)
    res.render('exploremore',{user})
})
app.get('/api/explore-images', async (req, res) => {
    try {
        const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
        const response = await axios.get(`https://api.unsplash.com/photos/random?count=10&client_id=${UNSPLASH_ACCESS_KEY}`);
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching images');
    }
});

//heading : conversation page (list of conversations)

app.get('/conversations',verifyToken,async(req,res)=>
    {
        const user = await usermodel.findById(req.user.id).populate('friends');
        const searchQuery = req.query.query || '';
        
            const conversations = await Conversation.find({ participants: req.user.id }).populate('participants');
            let searchResults = [];
        
            if (searchQuery) {
                searchResults = await usermodel.find({
                    username: new RegExp(searchQuery, 'i'),
                    _id: { $ne: req.user.id } 
                });
            }
        
            res.render('conversations', {
                conversations,
                searchResults,
                query: searchQuery,
                user 
            });
        });
      
    //heading : for particular conversation
    
    app.get('/message/:conversationId',verifyToken,async(req,res)=>
    {
        const searchResults=[]
        const query = req.query.query
        const userId = req.query.userId;
        const user = await usermodel.findById(userId)
        const conversationId = req.params.conversationId;
        const currentUser = req.user;
        const users = await usermodel.find({ _id: { $ne: currentUser._id } });
    
        const activeConversation = await Conversation.findById(conversationId).populate('participants') .populate('participants')
        .populate({
            path: 'messages',
            populate: {
                path: 'sender',
                select: 'username _id'
            }
        });
            const messages = await Message.find({ conversation: conversationId }).populate('sender','username _id');
            const validMessages = messages.filter(message => message.sender && message.sender._id);
            const conversations = await Conversation.find({ participants: req.user.id }).populate('participants');
    
            res.render('message', {
                activeConversation,
                messages:validMessages,
                conversations,
                currentUser,
                user,
                query,
                searchResults,
                users,
                conversationId
            });
    })
    

    app.get('/start-new-conversation',verifyToken,async(req,res)=>
    {
        const user = await usermodel.findById(req.user.id).populate('friends');
            const friends = user.friends;
    
            res.render('startConversation', { friends, currentUser: req.user,user });
    })
    
    app.post('/sendMessage', verifyToken, async (req, res) => {
        try {
            const { conversationId,content } = req.body;
            
           
            
            console.log('Received data:', { conversationId, content });
    
            if (!conversationId || !content) {
                return res.status(400).send('Conversation ID and content are required.');
            }
    
            const newMessage = new Message({
                conversation:conversationId,
                sender: req.user.id,
                content
            });
    
            await newMessage.save();
            await Conversation.findByIdAndUpdate(conversationId, {
                $push: { messages: newMessage._id }
              });
            const conversation = await Conversation.findById(conversationId).populate('participants');
        if (conversation) {
            // Assuming `participants` is an array of user IDs
            const participantIds = conversation.participants.map(p => p._id.toString());
            participantIds.forEach(async (participantId) => {
                // Assuming there's a method to add the latest message to each user's conversation
                await User.updateOne(
                    { _id: participantId, 'conversations._id': conversationId },
                    { $push: { 'conversations.$.messages': newMessage._id } }
                );
            });
        }
            res.redirect(`/message/${conversationId}`);
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).send('Internal Server Error');
        }
    });

//heading : Search bar 

app.get('/search', verifyToken, async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.render('notfound');
    }
    const results = await usermodel.find({username:new RegExp(query, 'i')}); 
    res.render('searchResults', { results, query });
});

//heading : search bar at conversation page

app.get('/searchuserchat', verifyToken, async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.render('notfound');
    }
    const results = await usermodel.find({username:new RegExp(query, 'i')}); 
    res.render('searchuserchat', { results, query });
});

//heading : about page

app.get('/about', verifyToken, async (req, res) => {
    const user = await usermodel.findById(req.user.id).populate('friends')
    .populate('friends', 'username profilePicture')
    .populate('friendRequests', 'username profilePicture')
    .populate('suggestions', 'username profilePicture');
    const posts = await postmodel.find({ author: req.user.id })
    let suggestions = await usermodel.find({ _id: { $ne: req.user.id } })
    suggestions = suggestions.filter(suggestion => 
        !user.friends.some(friend => friend._id.equals(suggestion._id))
    );
    res.render('about', { user,posts,suggestions});
});
app.get('/suggestions', verifyToken, async (req, res) => {
    const user = await usermodel.findById(req.user.id).populate('suggestions', 'username profilePicture');
    res.render('about', { suggestions: user.suggestions });
});
app.get('/friendRequests', verifyToken, async (req, res) => {
    const user = await usermodel.findById(req.user.id).populate('friendRequests', 'username profilePicture');
    res.render('friendRequests', { friendRequests: user.friendRequests });
});
app.post('/accept-friend', verifyToken, async (req, res) => {
    const requestId = req.body.requestId;

    const user = await usermodel.findById(req.user.id);
    if (user.friendRequests.includes(requestId)) {
        user.friends.push(requestId);
        user.friendRequests.pull(requestId);
        await user.save();

        const requester = await usermodel.findById(requestId);
        if (requester) {
            requester.friends.push(req.user.id);
            await requester.save();
        }
    }
    return res.redirect('/about?friends=true');
});

app.post('/send-request', verifyToken, async (req, res) => {
    const suggestionId = req.body.suggestionId;
    

    const user = await usermodel.findById(req.user.id);
    const suggestion = await usermodel.findById(suggestionId);

    if (suggestion && !suggestion.friendRequests.includes(req.user.id) && !suggestion.friends.includes(req.user.id)) {
        suggestion.friendRequests.push(req.user.id);
        await suggestion.save();
    }

    return res.redirect('/about?request=true');
});

app.post('/remove-friend', verifyToken, async (req, res) => {
    const user = await usermodel.findById(req.user.id)
    const { friendId } = req.body;

    
    await usermodel.findByIdAndUpdate(req.user.id, {
        $pull: { friends: friendId }
    });

    
    await usermodel.findByIdAndUpdate(friendId, {
        $pull: { friends: req.user.id }
    });

    res.redirect('/about');
});

app.get('/editbio', verifyToken, (req, res) => {
    res.render('editbio', { user: req.user });
});
app.post('/updateBio', verifyToken, async (req, res) => {
    const { bio } = req.body;
    const userId = req.user.id;

    await usermodel.findByIdAndUpdate(userId, { bio });

    res.redirect('/about');
});

app.post('/posts',verifyToken, async (req,res)=>{
    console.log("Hello x", req.body.post);
    const post = await postmodel.create({
    author: req.user.id,
    content: req.body.post,
    createdAt: new Date(),
    updatedAt: new Date()
    });
    res.redirect("/about");
})


app.get('/logout',(req,res)=>
{
    res.clearCookie('token');
    res.redirect('/login')
})
app.listen(3001,()=>
{
    console.log('server listening at port 3001')
}) 
