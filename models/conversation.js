const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/friendzy', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to conversation MongoDB');
}).catch(err => {
    console.error('Connection error', err);
});




const conversationSchema = new mongoose.Schema({
    
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user'}],
    // lastMessage: String,
    messages:[{type:mongoose.Schema.Types.ObjectId,ref:'Message',default:[]}],
    

},{timestamps:true});





const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;