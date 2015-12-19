var mongo = require('mongodb').MongoClient;
var io = require('socket.io');
var express = require('express');
var sha1 = require('sha1');
var jade = require('jade');
var app = express();
var server = app.listen(3000);
var clients = io.listen(server);

app.use(express.static(__dirname + '/build/assets'));
app.use(express.static(__dirname + '/bower_components'));

mongo.connect('mongodb://127.0.0.1:27017/chat', function (err, db) {

    var rooms = db.collection('rooms');
    var people = db.collection('people');
    var messages = db.collection('messages');

    people.remove({});
    rooms.update({}, {
        $set: {
            peopleCount: 0
        }
    }, {
        multi: true
    });

    app.get('/', function (req, res) {
        res.sendFile('/build/index.html', {root: __dirname});
    });

    function isEmpty(value) {
        var whitespacePattern = /^\s*$/;
        return whitespacePattern.test(value);
    }

    clients.on('connection', function (socket) {

        var whitespacePattern = /^\s*$/;

        rooms.find().toArray(function (err, roomsInfo) {
            if (err) {
                throw err;
            }
            messages.find({room: "global"}).toArray(function (err, messagesInfo) {
                if (err) {
                    throw err;
                }
                people.find({room: "global"}).toArray(function (err, peopleInfo) {
                    if (err) {
                        throw err;
                    }
                    socket.emit("populateChat", {roomsInfo: roomsInfo, messagesInfo: messagesInfo, peopleInfo: peopleInfo});
                });
            });
        });
        //socket.emit("populateChat", {roomsInfo: rooms.find()});

        socket.on("message", function (text) {
            if (whitespacePattern.test(text.trim())) {
                socket.emit("warning", "Message should not be empty!");
            } else {
                socket.emit("message", {name: "Igor", postedDate: new Date().toISOString(), text: text});
            }
        });

        socket.on("joined", function (username) {
            if (whitespacePattern.test(username.trim())) {
                socket.emit("validErrors", {modalId: "enter-chat-modal", errors: { "username": "Username should not be empty!" }});
            } else {
                people.insert({_id: "_" + socket.id, name: username, room: "global"});

                socket.emit("joined", {_id: "_" + socket.id, username: username, myself: true});
                socket.broadcast.emit("joined", {_id: "_" + socket.id, username: username});
            }
        });

        socket.on("createRoom", function (roomInfo) {
            var errors = {};
            if (whitespacePattern.test(roomInfo["room-name"])) {
                errors["room-name"] = "Name should not be empty!";
            }

            if (roomInfo["room-password"] !== roomInfo["room-password-confirm"]) {
                errors["room-password-confirm"] = "Password confirmation should match the password!";
            }

            if (whitespacePattern.test(roomInfo["room-code"])) {
                errors["room-code"] = "Code should not be empty!";
            } else if (roomInfo["room-code"] !== roomInfo["room-code-confirm"]) {
                errors["room-code-confirm"] = "Code confirmation should match the code!";
            }

            if (Object.keys(errors).length !== 0) {
                socket.emit("validErrors", {modalId: "create-room-modal", errors: errors});
            } else {

                var roomId = "_" + sha1(new Date().toString());
                rooms.insert({
                    _id: roomId,
                    name: roomInfo["room-name"],
                    peopleCount: 0,
                    password: roomInfo["room-password"],
                    code: roomInfo["room-code"]
                });

                roomInfo = {
                    name: roomInfo["room-name"],
                    peopleCount: 7,
                    roomId: roomId
                }

                socket.emit('createRoom', roomInfo);
                socket.broadcast.emit('createRoom', roomInfo);
            }
        });

        socket.on("left", function () {

            people.findOne({_id: "_" + socket.id}, function (err, userInfo) {
                if (err) {
                    throw err;
                }
                if (userInfo != null) {
                    socket.broadcast.emit("left", {userId: userInfo._id, username: userInfo.name});
                    people.deleteOne({_id: userInfo._id});
                }
            });
        });
    });
});
