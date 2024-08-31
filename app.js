const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const appModels = require('./models');

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

app.post('/posts',verifyToken, async (req,res)=>{
    console.log("Hello x", req.body.post);
    const post = await appModels.posts.create({
    author: req.user.id,
    content: req.body.post,
    createdAt: new Date(),
    updatedAt: new Date()
    });

    // res.send("Posted");
    res.redirect("/");
})
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
