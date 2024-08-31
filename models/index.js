const mongoose = require('mongoose');
const userSchema = require("./user");
const postSchema = require("./post");

mongoose.connect('mongodb://localhost:27017/friendzy', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Connection error', err);
});

module.exports = {
    users: mongoose.model("users",userSchema),
    posts: mongoose.model("posts",postSchema),
};

