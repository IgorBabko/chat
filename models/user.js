var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var sha1 = require('sha1');
var crypto = require('crypto');
var fs = require('fs');

function saveAvatar(name, avatarBase64) {
    var avatarPath = name + ".png";
    fs.writeFileSync(avatarPath, decodeBase64Image(avatarBase64));
    return avatarPath;
}

function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    // console.log("matches" + matches);
    if (matches.length !== 3) {
        return new Error('Invalid input string');
    } else {
        return new Buffer(matches[2], 'base64');
    }
}

var User = new Schema({
    _id: String,
    name: String,
    email: String,
    password: String,
    gender: String,
    avatar: String,
    roomName: String
});

User.pre('save', function(next) {
    this._id = crypto.randomBytes(20).toString('hex');
    next();
});

User.path('name').validate(function(value) {
    return !/^\s*$/.test(value.trim());
}, 'Usename should not be empty');

User.path('name').validate(function(value, callback) {
    UserModel.count({
        name: value
    }, function(err, count) {
        callback(count === 0);
    });
}, 'Name {VALUE} already exists');

User.path('email').validate(function(value) {
    return !/^\s*$/.test(value.trim());
}, 'Email should not be empty');

User.path('email').validate(function(value) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value);
}, '{VALUE} is not a valid email address');

User.path('email').validate(function(value, callback) {
    UserModel.count({
        email: value
    }, function(err, count) {
        callback(count === 0);
    });
}, 'Email {VALUE} already exists');

User.methods.setPassword = function(password, confirm) {
    if (/^\s*$/.test(password.trim())) {
        this.invalidate('password', new Error('Password should not be empty'));
        return false;
    }
    if (password !== confirm) {
        this.invalidate('password', new Error('Password should match confirmation'));
        return false;
    }
    this.password = sha1(password);
    return true;
}

User.post('save', function(user) {
    UserModel.update({
        _id: user._id
    }, {
        $set: {
            avatar: saveAvatar(user.name, user.avatar)
        }
    }, function() {});
});

var UserModel = mongoose.model('User', User);
module.exports = UserModel;
