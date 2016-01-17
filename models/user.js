var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

function trimVal(value) {
    return value.trim();
}

var User = new Schema({
    _id: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        set: trimVal,
        validate: [{
            validator: function(value) {
                UserModel.findOne({
                    'username': value
                }, function(err, existedUser) {
                    if (err) {
                        throw err;
                    }
                    return !!existedUser;
                });
            },
            message: 'User {VALUE} already exists'
        }, {
            validator: function(value) {
                var emptyPattern = /^\s*$/;
                return emptyPattern.test(value);
            },
            message: 'Username should not be empty'
        }]
    },
    email: {
        type: String,
        required: true,
        set: trimVal,
        validate: [{
            validator: function(value) {
                UserModel.findOne({
                    'email': value
                }, function(err, existedUser) {
                    if (err) {
                        throw err;
                    }
                    return !!existedUser;
                });
            },
            message: 'Email {VALUE} already exists'
        }, {
            validator: function(value) {
                var emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                return emailPattern.test(value);
            },
            message: 'Please fill a valid email address'
        }]
    },
    password: String,
    gender: String,
    avatar: String,
    roomName: String,
    isIncognito: Boolean
});
User.plugin(passportLocalMongoose);
var UserModel = mongoose.model('User', User);
module.exports = UserModel;