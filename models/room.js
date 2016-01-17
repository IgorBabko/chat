var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Room = new Schema({
    _id: String,
    name: String,
    password: String,
    code: String,
    peopleCount: Number,
    isIncognito: Boolean
});
module.exports = mongoose.model('Room', Room);