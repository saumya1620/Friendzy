const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/friendzy', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to message MongoDB');
}).catch(err => {
    console.error('Connection error', err);
});



const messageSchema = new mongoose.Schema({
    
    
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
   
    content: { type: String ,required:true},
    type: { type: String, default: 'text', enum: ['text', 'image', 'video'] }
    
},{timestamps:true});




const Message = mongoose.model('Message', messageSchema);

module.exports = Message;