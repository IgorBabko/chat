var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

var Room = new Schema({
    _id: String,
    name: String, // index: { unique: true }
    password: String,
    code: String,
    peopleCount: Number
});

var RoomModel = mongoose.model('Room', Room);
RoomModel.schema.path('name').validate(function(value) {
    console.log("this inside of validation:\n" + this);
    return !/^\s*$/.test(value.trim());
}, 'Name should not be empty');

RoomModel.schema.path('name').validate(function (value, callback) {
    RoomModel.count({
        name: value
    }, function(err, count) {
        callback(count === 0);
    });
}, 'Room {VALUE} already exists');

RoomModel.schema.path('password').validate(function(value) {
    return !/^\s*$/.test(value.trim());
}, 'Password should not be empty');

RoomModel.schema.path('password').validate(function(value) {
    return value.trim().length > 5;
}, 'Password must be at least 6 characters');

RoomModel.schema.path('code').validate(function(value) {
    return !/^\s*$/.test(value.trim());
}, 'Code should not be empty');

RoomModel.schema.path('code').validate(function(value) {
    return value.trim().length > 5;
}, 'Code must be at least 6 characters');
//////////


Room.pre('save', function(next) {
    var room = this;

    // only hash the password if it has been modified (or is new)
    if (!room.isModified('password')) return next();

    // only hash the code if it has been modified (or is new)
    if (!room.isModified('code')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(room.password, salt, null, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            room.password = hash;
            next();
        });

        // hash the code using our new salt
        bcrypt.hash(room.code, salt, null, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            room.code = hash;
            next();
        });
    });
});

Room.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

Room.methods.compareCode = function(candidateCode, cb) {
    bcrypt.compare(candidateCode, this.code, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = RoomModel;