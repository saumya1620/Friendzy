// import { Schema, model } from 'mongoose';

const { text } = require('express');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/friendzy', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to user MongoDB');
}).catch(err => {
    console.error('Connection error', err);
});



const userschema = mongoose.Schema
({
    username: {
        type: String,
        required: true,  
        trim: true,
        unique: true       
    },
    email: {
        type: String,
        required: true,      
        lowercase: true, 
        trim: true,
    },
    phonenumber: {
        type: Number,
  
        
    },     
    password: {
        type: String,
        required: true    
    },
    gender: {
        type: String,
        required: true,
        lowercase: true, 
        trim: true
    },
    date: {
        type: Date,
        
    },
    profilePicture: {
        type: String, 
        default: '/images/user.png' 
    },
    bio: { type: String, default: '' },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user',default:[]}],
    suggestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]  
}, {timestamps : true},{ collection: 'user' });

const usermodel = mongoose.model('user',userschema)
module.exports = usermodel;

// export default models('user',userschema)

