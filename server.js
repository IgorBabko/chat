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
                    socket.emit("populateChat", {
                        roomsInfo: roomsInfo,
                        messagesInfo: messagesInfo,
                        peopleInfo: peopleInfo
                    });
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
                socket.emit("validErrors", {
                    modalId: "enter-chat-modal",
                    errors: {"username": "Username should not be empty!"}
                });
            } else {
                people.insert({_id: "_" + socket.id, name: username, room: "global"});
                rooms.update({name: "global"}, {$inc: {peopleCount: 1}});
                rooms.findOne({name: "global"}, function (err, roomInfo) {
                    if (err) {
                        throw err;
                    }
                    socket.join("global");
                    socket.room = "global";
                    socket.emit("joined", {
                        _id: "_" + socket.id,
                        name: username,
                        myself: true
                    });
                    socket.broadcast.emit("joined", {
                        _id: "_" + socket.id,
                        name: username
                    });
                    clients.emit("updatePeopleCounters", {
                        newRoomInfo: {_id: roomInfo._id, peopleCount: roomInfo.peopleCount}
                    });
                })
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
                    password: sha1(roomInfo["room-password"]),
                    code: roomInfo["room-code"]
                });

                roomInfo = {
                    name: roomInfo["room-name"],
                    peopleCount: 0,
                    _id: roomId
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
                rooms.update({name: socket.room}, {$inc: {peopleCount: -1}});
                rooms.findOne({name: socket.room}, function (err, roomInfo) {
                    if (err) {
                        throw err;
                    }
                    if (userInfo != null) {
                        console.log(roomInfo);
                        socket.broadcast.emit("left", {
                            userId: userInfo._id,
                            name: userInfo.name
                        });
                        people.deleteOne({_id: userInfo._id});
                        clients.emit("updatePeopleCounters", {
                            newRoomInfo: {_id: roomInfo._id, peopleCount: roomInfo.peopleCount}
                        });
                    }
                });
            });
        });

        socket.on("changeRoom", function (data) {

            rooms.findOne({_id: data.newRoomId}, function (err, newRoomInfo) {
                if (err) {
                    throw err;
                }
                if (data.password) {
                    if (newRoomInfo.password !== sha1(data.password)) {
                        socket.emit("validErrors", {
                            modalId: "room-password-modal",
                            errors: {"password": "Password is wrong!"}
                        });
                    }
                } else {

                    console.log("changeRoom");
                    rooms.update({name: socket.room}, {$inc: {peopleCount: -1}});
                    rooms.update({_id: data.newRoomId}, {$inc: {peopleCount: 1}});
                    rooms.findOne({name: socket.room}, function (err, oldRoomInfo) {
                        if (err) {
                            throw error;
                        }

                        people.findOne({_id: "_" + socket.id}, function (err, userInfo) {
                            if (err) {
                                throw err;
                            }
                            people.find({room: newRoomInfo.name}).toArray(function (err, peopleFromNewRoom) {
                                if (err) {
                                    throw err;
                                }

                                socket.leave(oldRoomInfo.name);
                                socket.join(newRoomInfo.name);
                                socket.room = newRoomInfo.name;

                                socket.emit("changeRoom", {
                                    peopleFromNewRoom: peopleFromNewRoom,
                                    newRoomId: newRoomInfo._id,
                                    userInfo: {
                                        _id: userInfo._id,
                                        name: userInfo.name
                                    }
                                });
                                socket.broadcast.to(oldRoomInfo.name).emit("changeRoom", {
                                    _id: userInfo._id,
                                    name: userInfo.name,
                                    status: "left"
                                });
                                socket.broadcast.to(newRoomInfo.name).emit("changeRoom", {
                                    _id: userInfo._id,
                                    name: userInfo.name,
                                    status: "joined"
                                });
                                clients.emit("updatePeopleCounters", {
                                    newRoomInfo: {_id: newRoomInfo._id, peopleCount: newRoomInfo.peopleCount + 1},
                                    oldRoomInfo: {_id: oldRoomInfo._id, peopleCount: oldRoomInfo.peopleCount}
                                });
                                people.update({_id: "_" + socket.id}, {$set: {room: newRoomInfo.name}});
                            });
                        });
                    });
                }
            });
        });
    });
});
