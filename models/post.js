const { text } = require('express');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/friendzy', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to post MongoDB');
}).catch(err => {
    console.error('Connection error', err);
});



const postSchema = mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    imagePath:{type:String,required:false},
    videoPath:{type:String,required:false},
    updatedAt: { type: Date, default: Date.now }, 
});




const postmodel = mongoose.model('post',postSchema)
module.exports = postmodel;
