var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Message = new Schema({
    _id: String,
    authorId: String,
    postedDate: String,
    text: String,
    roomName: String
});
module.exports = mongoose.model('Message', Message);