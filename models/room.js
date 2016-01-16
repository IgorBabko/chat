var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var user = new Room({
    name: String,
    password: String,
    code: String,
    peopleCount: Number,
    isIncognito: Boolean
});
module.exports = mongoose.model('Room', Room);