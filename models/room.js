var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var sha1 = require('sha1');
// var bcrypt = require('bcrypt');
// var SALT_WORK_FACTOR = 10;

var Room = new Schema({
    _id: String,
    name: String, // index: { unique: true }
    password: String,
    code: String,
    peopleCount: Number
});

Room.pre('save', function(next) {
    this._id = sha1(new Date().toString());
    next();
});

Room.path('name').validate(function(value) {
    return !/^\s*$/.test(value.trim());
}, 'Name should not be empty');

Room.path('name').validate(function(value, callback) {
    RoomModel.count({
        name: value
    }, function(err, count) {
        callback(count === 0);
    });
}, 'Room {VALUE} already exists');

Room.methods.setPassword = function setPassword(password, confirm) {
    if (password !== confirm) {
        this.invalidate('password', new Error('Password should match confirmation'));
        return false;
    }
    // if (password.length === 0) {
        // this.password = password;
    // } else {
        this.password = sha1(password);
    // }
    return true;
}

Room.methods.setCode = function(code, confirm) {
    if (/^\s*$/.test(code.trim())) {
        this.invalidate('code', new Error('Code should not be empty'));
        return false;
    }
    // if (code.trim().length < 6) {
    //     this.invalidate('code', new Error('Code must be at least 6 characters'));
    //     return false;
    // }
    if (code !== confirm) {
        this.invalidate('code', new Error('Code should match confirmation'));
        return false;
    }
    this.code = sha1(code);
    return true;
}

var RoomModel = mongoose.model('Room', Room);
module.exports = RoomModel;
