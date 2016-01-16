var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var UserModel = mongoose.model('User', User);


var User = new Schema({
    username: {
        type: String,
        required: true,
        validate: [{
            validator: function(value) {
                UserModel.findOne({'username': value}, function (err, existedUser) {
                    if (err) {
                        throw err;
                    }
                    return !!existedUser;
                });
            },
            msg: 'User {VALUE} already exists'
        }, {
            validator: function(value) {
                var emptyPattern = /^\s*$/;
                return emptyPattern.test(value);
            },
            msg: 'Username should not be empty'
        }]
    }
    email: {
        type: String,
        required: true,
        validate: [{
            validator: function(value) {
                UserModel.findOne({'email': value}, function (err, existedUser) {
                    if (err) {
                        throw err;
                    }
                    return !!existedUser;
                });
            },
            msg: 'Email {VALUE} already exists'
        }, {
            validator: function(value) {
                var emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                return emailPattern.test(value);
            },
            msg: 'Please fill a valid email address'
        }]
    password: String,
    gender: String,
    avatar: String
});

User.plugin(passportLocalMongoose);
module.exports = userModel;