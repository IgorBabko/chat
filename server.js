var mongo = require('mongodb').MongoClient;
var io = require('socket.io');
var sha1 = require('sha1');
var jade = require('jade');
var express = require('express');
var app = express();

var ip = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || '8000';

var server = app.listen(port, ip);
var clients = io.listen(server);


app.use(express.static(__dirname + '/build/assets'));
app.use(express.static(__dirname + '/bower_components'));

// default to a 'localhost' configuration:
var connection_string = '127.0.0.1:27017/chat';
// if OPENSHIFT env variables are present, use the available connection info:
if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
    connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
        process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
        process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
        process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
        process.env.OPENSHIFT_APP_NAME;
}

mongo.connect('mongodb://' + connection_string, function (err, db) {

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
        res.sendFile(__dirname + '/build/index.html');
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
                socket.emit("emptyMessage");
            } else {
                people.findOne({_id: "_" + socket.id}, function (err, author) {
                    if (err) {
                        throw err;
                    }
                    var message = {
                        author: author.name,
                        postedDate: new Date().toISOString(),
                        text: text,
                        room: socket.room
                    };
                    messages.insert(message);
                    socket.broadcast.to(socket.room).emit("message", message);
                    message.myself = true;
                    socket.emit("message", message);
                });
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
                rooms.findOne({name: "global"}, function (err, globalRoomInfo) {
                    if (err) {
                        throw err;
                    }
                    rooms.findOne({name: "global"}, function (err, roomInfo) {
                        if (err) {
                            throw err;
                        }
                        socket.join("global");
                        socket.room = "global";
                        socket.emit("joined", {
                            _id: "_" + socket.id,
                            name: username,
                            myself: true,
                            globalRoomId: globalRoomInfo._id
                        });
                        socket.broadcast.emit("joined", {
                            _id: "_" + socket.id,
                            name: username
                        });
                        clients.emit("updatePeopleCounters", {
                            newRoomInfo: {_id: roomInfo._id, peopleCount: roomInfo.peopleCount}
                        });
                    });
                });
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
                    code: sha1(roomInfo["room-code"])
                });

                roomInfo = {
                    name: roomInfo["room-name"],
                    peopleCount: 0,
                    _id: roomId
                }

                people.findOne({_id: "_" + socket.id}, function (err, userInfo) {
                    if (err) {
                        throw err;
                    }
                    socket.emit('createRoom', {
                        roomInfo: roomInfo,
                        message: "Room " + roomInfo["room-name"] + " has been created successfully"
                    });
                    socket.broadcast.emit('createRoom', {
                        roomInfo: roomInfo,
                        message: "User " + userInfo.name + " has created the room " + roomInfo["room-name"]
                    });
                });
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
                if (newRoomInfo.password !== sha1(data.password)) {
                    socket.emit("validErrors", {
                        modalId: "room-password-modal",
                        errors: {"password": "Password is wrong!"}
                    });
                } else {
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

                                messages.find({room: newRoomInfo.name}).toArray(function (err, messagesFromNewRoom) {
                                    if (err) {
                                        throw err;
                                    }
                                    socket.leave(oldRoomInfo.name);
                                    socket.join(newRoomInfo.name);
                                    socket.room = newRoomInfo.name;

                                    socket.emit("changeRoom", {
                                        peopleFromNewRoom: peopleFromNewRoom,
                                        newRoomId: newRoomInfo._id,
                                        messages: messagesFromNewRoom,
                                        userInfo: {
                                            _id: userInfo._id,
                                            name: userInfo.name
                                        },
                                        message: "Room has been changed successfully"
                                    });
                                    socket.broadcast.to(oldRoomInfo.name).emit("changeRoom", {
                                        _id: userInfo._id,
                                        name: userInfo.name,
                                        status: "left",
                                        message: "User " + userInfo.name + " left " + oldRoomInfo.name + " room"
                                    });
                                    socket.broadcast.to(newRoomInfo.name).emit("changeRoom", {
                                        _id: userInfo._id,
                                        name: userInfo.name,
                                        status: "joined",
                                        message: "User " + userInfo.name + " joined " + newRoomInfo.name + " room"
                                    });
                                    clients.emit("updatePeopleCounters", {
                                        newRoomInfo: {_id: newRoomInfo._id, peopleCount: newRoomInfo.peopleCount + 1},
                                        oldRoomInfo: {_id: oldRoomInfo._id, peopleCount: oldRoomInfo.peopleCount}
                                    });
                                    people.update({_id: "_" + socket.id}, {$set: {room: newRoomInfo.name}});
                                });
                            });
                        });
                    });
                }
            });
        });


        socket.on("deleteRoom", function (data) {
            rooms.findOne({_id: data.roomId}, function (err, roomInfo) {
                if (err) {
                    throw err;
                }
                if (roomInfo.code !== sha1(data.code)) {
                    socket.emit("validErrors", {
                        modalId: "room-password-modal",
                        errors: {"code": "Code is wrong!"}
                    });
                } else {
                    people.find({room: roomInfo.name}).count(function (err, peopleCountInDeletedRoom) {
                        if (err) {
                            throw err;
                        }
                        rooms.update({name: "global"}, {$inc: {peopleCount: peopleCountInDeletedRoom}});

                        rooms.findOne({name: "global"}, function (err, globalRoomInfo) {
                            if (err) {
                                throw err;
                            }
                            people.find({room: roomInfo.name}).toArray(function (err, peopleFromDeletedRoom) {
                                if (err) {
                                    throw err;
                                }
                                people.update({room: roomInfo.name}, {$set: {room: "global"}}, {multi: true});
                                people.find({room: "global"}).toArray(function (err, peopleFromGlobalRoom) {
                                    if (err) {
                                        throw err;
                                    }
                                    console.log("------");
                                    console.log(peopleFromGlobalRoom);
                                    console.log("------");
                                    // if user isn't in the global room don't send people info to the client
                                    messages.find({"room": "global"}).toArray(function (err, messagesFromGlobalRoom) {
                                        if (err) {
                                            throw err;
                                        }
                                        socket.emit("deleteRoom", {
                                            peopleFromDeletedRoom: peopleFromDeletedRoom,
                                            peopleFromGlobalRoom: peopleFromGlobalRoom,
                                            messages: messagesFromGlobalRoom,
                                            myself: true
                                        });

                                        socket.broadcast.to(roomInfo.name).emit("deleteRoom", {
                                            peopleFromDeletedRoom: peopleFromDeletedRoom,
                                            peopleFromGlobalRoom: peopleFromGlobalRoom,
                                            messages: messagesFromGlobalRoom,
                                        });

                                        socket.broadcast.to("global").emit("deleteRoom", {
                                            peopleFromDeletedRoom: peopleFromDeletedRoom,
                                            global: true
                                        });

                                        var allClients = clients.sockets.connected;
                                        for (var clientId in allClients) {
                                            if (allClients[clientId].room === roomInfo.name) {
                                                allClients[clientId].leave(roomInfo.name);
                                                allClients[clientId].join("global");
                                                allClients[clientId].room = "global";
                                            }
                                        }
                                        ////
                                        socket.emit("notification", "Room " + roomInfo.name + " has been deleted.");
                                        socket.broadcast.emit("notification", "Room " + roomInfo.name + " has been deleted.");
                                        clients.emit("deleteRoomItem", data.roomId);

                                        clients.emit("updatePeopleCounters", {
                                            newRoomInfo: {
                                                _id: globalRoomInfo._id,
                                                peopleCount: globalRoomInfo.peopleCount
                                            }
                                        });
                                        rooms.deleteOne({_id: data.roomId});
                                        messages.remove({room: roomInfo.name});
                                    });
                                });
                            });
                        });
                    });
                }
            });
        });

        socket.on("startTyping", function (id) {
            console.log("start");
            socket.broadcast.to(socket.room).emit("startTyping", id);
        });

        socket.on("stopTyping", function (id) {
            console.log("stop");
            socket.broadcast.to(socket.room).emit("stopTyping", id);
        });
    });
});
