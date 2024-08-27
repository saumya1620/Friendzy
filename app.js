const express = require('express')
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


app.get('/',(req,res)=>
{
    res.render('index')
})
app.post('/create',(req,res)=>
{
    let {username,email,password,age}=req.body
    const saltrounds = 10
    bcrypt.genSalt(saltrounds,(err,salt)=>
    {
        bcrypt.hash(password,salt,async (err,hash)=>
        {
            let usercreated = await usermodel.create ({
                username,
                email,
                password:hash,
                age
            })
            console.log(usercreated)
            res.redirect('/?welcome=true'); 
            res.render('/')
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
    if(!user) res.send('Email or Password is Incorrect')

    bcrypt.compare(req.body.password, user.password, (err, result)=>{
        if(result){
            let token = jwt.sign({email: user.email}, "secretKey")
            res.cookie('token', token)
            res.send('Login Successfull')
        }
        else res.send('Email or Paaword is Incorrect')
    })
})


app.get('/logout',(req,res)=>
{
    res.cookie('token','')
    res.redirect('/')
})
app.listen(3001,()=>
{
    console.log('server listening at port 3001')
})