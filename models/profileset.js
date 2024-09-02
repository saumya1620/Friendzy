const mongoose = require('mongoose')

const profileschema = mongoose.Schema
({
    username:
    {
        type: String,
        lowercase: true,
        unique:true
    }
},{ collection: 'profile' }
)
module.exports = profileschema;