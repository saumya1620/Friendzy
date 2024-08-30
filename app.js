const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const usermodel = require('./models/user')

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

app.get('/',(req,res)=>
{
    res.render('index')
})

app.get('/profile', verifyToken, async (req, res) => {
    const user = await usermodel.findById(req.user.id);
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
            return res.redirect('/login?welcome=true')
            
            
        })
         
    })
    
})


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
app.get('/profile',verifyToken, async (req,res)=>
{
    const user = await usermodel.findById(req.user.id);
    res.render('profile', { user });

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
