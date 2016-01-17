var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Message = new Schema({
    _id: String,
    author: String,
    postedDate: String,
    text: String,
    roomName: String
});
var MessageModel = mongoose.model('Message', Message);
MessageModel.schema.path('text').validate(function(value) {
    return !/^\s*$/.test(value.trim());
}, 'Message should not be empty');
module.exports = MessageModel;