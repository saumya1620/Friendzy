const { text } = require('express');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/friendzy', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to request MongoDB');
}).catch(err => {
    console.error('Connection error', err);
});



const friendRequestSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});







const requestmodel = mongoose.model('FriendRequest',friendRequestSchema)
module.exports = requestmodel;