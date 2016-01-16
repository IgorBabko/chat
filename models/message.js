var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var user = new Message({
    authorId: String,
    postedDate: String,
    text: String
});
module.exports = mongoose.model('Message', Message);