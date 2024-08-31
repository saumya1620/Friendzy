const mongoose = require('mongoose');
const userSchema = new mongoose.Schema
({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },
    gender: { type: String },
    dob: { type: Date }
}, { collection: 'user' });

module.exports = userSchema;

