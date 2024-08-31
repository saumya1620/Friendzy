const mongoose = require('mongoose');
const postSchema = new mongoose.Schema
({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    content: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now }, 
    updatedAt: { type: Date, default: Date.now }, 
}, { collection: 'posts' });

module.exports = postSchema;

