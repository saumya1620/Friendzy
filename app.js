const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const appModels = require('./models');
const multer  = require('multer')
const upload = multer({ dest: 'public/images/posts/' })
const { Post, Comment, User } = appModels;
const axios = require('axios');
require('dotenv').config();

const app = express()
const secret = 'your_jwt_secret_key'

//Middleware
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,'public')))
app.use(cookieParser())
app.set('view engine','ejs')

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

app.get('/', verifyToken,async(req,res)=>
{
    const suggestedUsers = [
        { name: 'suman', avatar: '/path/to/avatar1.png' },
        { name: 'Kaji', avatar: '/path/to/avatar2.png' },
        // Add more users as needed
      ];
      const posts = await appModels.posts.find({author: req.user.id});

      
      res.render('index', {
        user: req.user, 
        suggestedUsers: suggestedUsers,
        posts : posts
    }); 
})

app.get('/profile', verifyToken, async (req, res) => {
    const user = await appModels.users.findById(req.user.id);
    const sidebarLinks = [
        { label: 'Home', route: '/', imgURL: 'public/images/Friendzy.png' },
        { label: 'Profile', route: '/profile', imgURL: '/public/images/user.png' },
        // Add more links as needed
    ];
    res.render('profile', { user, sidebarLinks, pathname: '/profile' });
});


app.post('/create',async (req,res)=>
{
    let { username, email, phonenumber, password, confirmPassword, gender, date } = req.body;
    let usercreated = await appModels.users.findOne({username})
    
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
            usercreated = await appModels.users.create ({
                username,
                email,
                phonenumber,
                password:hash,
                gender,
                date

            })
            console.log(usercreated)
            return res.redirect('/login?welcome=true')
            
            
        })
         
    })
    
})


app.get('/login',(req,res)=>
{
    res.render('login')
})

app.post('/login', async (req,res) => {
    let user = await appModels.users.findOne({username: req.body.username})
    console.log(user)
    if(!user) res.redirect('/?incorrect=true');

    bcrypt.compare(req.body.password, user.password, (err, result)=>{
        if(result){
            // let token = jwt.sign({email: user.email}, "secretKey")
            let token = jwt.sign({ id: user._id, username: user.username }, secret);
            res.cookie('token', token, { httpOnly: true})
            
            // res.status(200).render('profile',{user})
            res.redirect('/');
        }
        else
        {
            res.redirect('/?incorrect=true'); 

        }
    })
})
app.get('/signup',(req,res)=>{
    res.render('signup');
})
// app.get('/profile',verifyToken, async (req,res)=>
// {
//     const user = await appModels.users.findById(req.user.id);
//     res.render('profile', { user });

// })

app.post('/posts',verifyToken, upload.fields([{name:"post-img", maxCount:1}, {name:"video-img", maxCount:1}]), async (req,res)=>{
    console.log("files",req.files);
    const imageFiles = req.files['post-image'];
    
    const post = await appModels.posts.create({
    author: req.user.id,
    content: req.body.post,
    createdAt: new Date(),
    updatedAt: new Date()
    });

    // res.send("Posted");
    res.redirect("/");
})

app.get('/', verifyToken, async (req, res) => {
    try {
        const posts = await Post.find({ author: req.user.id })
            .populate('likes') // Populate if necessary
            .populate({
                path: 'comments',
                populate: {
                    path: 'userId', // Assuming comments have userId field
                    select: 'username'
                }
            });
        
        res.render('index', {
            user: req.user,
            suggestedUsers: suggestedUsers,
            posts: posts
        });
    } catch (err) {
        console.error(err);
        res.redirect('/login');
    }
});

// Define your
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


// Like a post
app.post('/posts/:postId/like', verifyToken, async (req, res) => {
    try {
      const postId = req.params.postId;
      const userId = req.user.id;
  
      const post = await appModels.posts.findById(postId);
  
      if (post.likes.includes(userId)) {
        // Unlike if already liked
        post.likes.pull(userId);
      } else {
        // Like if not already liked
        post.likes.push(userId);
      }
  
      await post.save();
      res.redirect('back'); // Redirect back to the previous page
    } catch (err) {
      console.error(err);
      res.redirect('back'); // Handle errors and redirect
    }
  });
  //post a comment
  app.post('/posts/:postId/comments', verifyToken, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id;
        const commentContent = req.body.commentContent;

        // Create a new comment
        const comment = await Comment.create({
            content: commentContent,
            post: postId,
            author: userId
        });

        // Add the comment to the post's comments array
        await Post.findByIdAndUpdate(postId, {
            $push: { comments: comment._id }
        });

        res.redirect('/posts/${postId}'); // Redirect to the post page or another appropriate page
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});
// Like a comment
app.post('/comments/:commentId/like', verifyToken, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);

        if (!comment.likes) comment.likes = [];
        if (comment.likes.includes(userId)) {
            comment.likes.pull(userId);
        } else {
            comment.likes.push(userId);
        }

        await comment.save();
        res.redirect('back');
    } catch (err) {
        console.error(err);
        res.redirect('back');
    }
});

app.get('/logout',(req,res)=>
{
    // res.cookie('token','')
    res.clearCookie('token');
    res.redirect('/login')
})
app.listen(3001,()=>
{
    console.log('server listening at port 3001')
}) 