var mongoose = require('mongoose');
var crypto = require('crypto');
var Schema = mongoose.Schema;

var Message = new Schema({
    _id: String,
    author: String,
    postedDate: String,
    text: String,
    roomName: String
});

Message.pre('save', function(next) {
    this._id = crypto.randomBytes(20).toString('hex');
    next();
});

var MessageModel = mongoose.model('Message', Message);

MessageModel.schema.path('text').validate(function(value) {
    return !/^\s*$/.test(value.trim());
}, 'Message should not be empty');
module.exports = MessageModel;