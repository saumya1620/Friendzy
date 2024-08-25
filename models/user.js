// import { Schema, model } from 'mongoose';

const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/friendzy', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Connection error', err);
});



const userschema = new mongoose.Schema
({
    username : String,
    email: String,
    password: String,
    age: Number, 
}, { collection: 'user' });

const usermodel = mongoose.model("user",userschema)
module.exports = usermodel;

// export default models('user',userschema)