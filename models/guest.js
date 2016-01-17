var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function trimVal(value) {
    return value.trim();
}
var Guest = new Schema({
    _id: String,
    name: {
        type: String,
        set: trimVal
    },
    roomName: String
});

var GuestModel = mongoose.model('Guest', Guest);

GuestModel.schema.path('name').validate(function (value, callback) {
    GuestModel.count({
        name: value
    }, function(err, count) {
        callback(count === 0);
    });
}, 'Guest {VALUE} already exists');

GuestModel.schema.path('name').validate(function (value) {
    return !/^\s*$/.test(value);
}, 'Name should not be empty');

module.exports = GuestModel;