var fs = require("fs");
// var mongo = require('mongodb').MongoClient;
var io = require('socket.io');
var sha1 = require('sha1');
var jade = require('gulp-jade');
var logger = require('morgan');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var express = require('express');
var app = express();
// include mongoDB collections
var User = require('./models/user');
var Guest = require('./models/guest');
var Room = require('./models/room');
var Message = require('./models/message');
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
var ip = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || '8000';
var server = app.listen(port, ip);
var clients = io.listen(server);
app.use(express.static(__dirname + '/build/assets'));
app.use(express.static(__dirname + '/bower_components'));
// default to a 'localhost' configuration:
var connection_string = '127.0.0.1:27017/chat';
// if OPENSHIFT env variables are present, use the available connection info:
if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
    connection_string = process.env.OPENSHIFT_MONGODB_DB_name + ":" + process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" + process.env.OPENSHIFT_MONGODB_DB_HOST + ':' + process.env.OPENSHIFT_MONGODB_DB_PORT + '/' + process.env.OPENSHIFT_APP_NAME;
}
console.log(connection_string);
// passport config
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// regexp for URLs and E-mails
if (!String.linkify) {
    String.prototype.linkify = function() {
        // http://, https://, ftp://
        var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;
        // www. sans http:// or https://
        var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        // Email addresses
        var emailAddressPattern = /[\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6})+/gim;
        return this.replace(urlPattern, '<a href="$&" target="_blank">$&</a>').replace(pseudoUrlPattern, '$1<a href="http://$2" target="_blank">$2</a>').replace(emailAddressPattern, '<a href="mailto:$&" target="_blank">$&</a>');
    };
}

function populateChat(userData, socket) {
    Room.find({}, function(err, roomsInfo) {
        if (err) {
            throw err;
        }
        Message.find({
            roomName: "global"
        }, function(err, messagesInfo) {
            if (err) {
                throw err;
            }
            // console.log(messagesInfo);
            Guest.find({
                roomName: "global",
                _id: {
                    $ne: userData._id
                }
            }, function(err, peopleInfo) {
                if (err) {
                    throw err;
                }
                roomsInfo[0].peopleCount++;
                socket.emit("populateChat", {
                    roomsInfo: roomsInfo,
                    messagesInfo: messagesInfo,
                    peopleInfo: peopleInfo
                });
                Room.findOne({
                    name: "global"
                }, function(err, globalRoomInfo) {
                    if (err) {
                        throw err;
                    }
                    Room.findOne({
                        name: "global"
                    }, function(err, roomInfo) {
                        if (err) {
                            throw err;
                        }
                        socket.join("global");
                        socket.room = "global";

                        if (userData.signedIn) {
                            console.log("signedIn");
                            socket.emit("login", {
                                _id: userData._id,
                                name: userData.name,
                                myself: true,
                                globalRoomId: globalRoomInfo._id
                            });
                        } else {
                            socket.emit("enterAsGuest", {
                                _id: userData._id,
                                name: userData.name,
                                myself: true,
                                globalRoomId: globalRoomInfo._id
                            });
                        }


                        socket.emit("notification", {
                            message: "Welcome, <span class='highlighted'>" + userData.name + "</span>!",
                            type: "actionPerformed"
                        });
                        socket.broadcast.to("global").emit("enterAsGuest", {
                            _id: userData._id,
                            name: userData.name
                        });
                        socket.broadcast.emit("notification", {
                            message: "User <span class='highlighted'>" + userData.name + "</span> has joined the chat",
                            type: "general"
                        });
                        clients.emit("updatePeopleCounters", {
                            newRoomInfo: {
                                _id: roomInfo._id,
                                peopleCount: roomInfo.peopleCount
                            }
                        });
                    });
                });
            });
        });
    });
}

function sendValidErrors(err, modalId, socket) {
    var errorMessages = {};
    if (err.errors) {
        var errors = err.errors;
        for (var field in errors) {
            if (errors.hasOwnProperty(field)) {
                errorMessages[field] = errors[field].message
            }
        }
    }
    socket.emit("validErrors", {
        modalId: modalId,
        errors: errorMessages
    });
}

function notify(message, type, socket) {
    socket.emit("notification", {
        message: message,
        type: type
    });
}

// join functions (login, signup, incognito)
function enterAsGuest(guestData, socket) {
    guestData._id = "_" + socket.id.slice(2);
    guestData.roomName = "global";
    var guest = new Guest(guestData);
    guest.save(function(err) {
        if (err) {
            sendValidErrors(err, "guest", socket);
        } else {
            socket.loggedIn = false;
            Room.update({
                name: "global"
            }, {
                $inc: {
                    peopleCount: 1
                }
            }, function(err, doc) {
                if (err) {
                    throw err;
                }
                populateChat(guestData, socket);
            });
        }
    });
}

function addMessage(text, socket) {
    console.log("loggedIn: " + socket.loggedIn);
    var People = socket.loggedIn ? User : Guest;
    People.findOne({
        _id: "_" + socket.id.slice(2)
    }, function(err, author) {
        if (err) {
            throw err;
        }
        var message = {
            _id: "_" + sha1(new Date().toString()),
            author: author.name,
            postedDate: new Date().toISOString(),
            text: text.linkify(),
            roomName: socket.room
        };

        var messageObj = new Message(message);
        messageObj.save(function(err) {
            // console.log(err);
            if (err) {
                notify(err.errors.text.message, "validErrors", socket);
            } else {
                socket.broadcast.to(socket.room).emit("message", message);
                message.isMine = true;
                socket.emit("message", message);
            }
        });
    });
}

function createRoom(roomInfo, socket) {
    // TODO: you know
    var room = new Room({
        name: roomInfo["name"],
        peopleCount: 0
    });
    room.setPassword(roomInfo["password"], roomInfo["password-confirm"]);
    room.setCode(roomInfo["code"], roomInfo["code-confirm"]);
    room.save(function(err) {
        if (err) {
            sendValidErrors(err, "create-room-modal", socket);
        } else {
            roomInfo = {
                name: roomInfo["name"],
                peopleCount: 0,
                status: room.status,
                _id: room._id
            }
            Guest.findOne({
                _id: "_" + socket.id.slice(2)
            }, function(err, userInfo) {
                if (err) {
                    throw err;
                }
                clients.emit('createRoom', {
                    roomInfo: roomInfo
                });
                socket.emit("notification", {
                    message: "Room <span class='highlighted'>" + roomInfo.name + "</span> has been created successfully",
                    type: "actionPerformed"
                });
                // socket.broadcast.emit('createRoom', {
                //     roomInfo: roomInfo
                // });
                socket.broadcast.emit("notification", {
                    message: "User <span class='highlighted'>" + userInfo.name + "</span> has created the room <span class='highlighted'>" + roomInfo.name + "</span>",
                    type: "general"
                });
            });
        }
    });
}

function guestLeft(socket) {
    Guest.findOne({
        _id: "_" + socket.id.slice(2)
    }, function(err, guestInfo) {
        if (err) {
            throw err;
        }
        Room.update({
            name: socket.room
        }, {
            $inc: {
                peopleCount: -1
            }
        }, function(err, doc) {
            if (err) {
                throw err;
            }
            Room.findOne({
                name: socket.room
            }, function(err, roomInfo) {
                if (err) {
                    throw err;
                }
                if (guestInfo != null) {
                    Guest.remove({
                        _id: guestInfo._id
                    }, function(err) {
                        if (err) {
                            throw err;
                        }
                        clients.emit("guestLeft", {
                            userId: guestInfo._id,
                            name: guestInfo.name
                        });
                        clients.emit("updatePeopleCounters", {
                            newRoomInfo: {
                                _id: roomInfo._id,
                                peopleCount: roomInfo.peopleCount
                            }
                        });
                        clients.emit("notification", {
                            message: "User <span class='highlighted'>" + guestInfo.name + "</span> has left the chat",
                            type: "general"
                        });
                    });
                }
            });
        });
    });
}

function cleanDBAfterServerReload() {
    Guest.remove(function() {});
    Room.update({}, {
        $set: {
            peopleCount: 0
        }
    }, {
        multi: true
    }, function() {});
}

function changeRoom(roomInfo, socket) {
    Room.findOne({
        _id: roomInfo.newRoomId
    }, function(err, newRoomInfo) {
        if (err) {
            throw err;
        }
        if (roomInfo.status === "private" && newRoomInfo.password !== sha1(roomInfo.password)) {
            sendValidErrors({
                password: "Password is wrong"
            }, "room-password-modal", socket);
        } else {
            Room.update({
                name: socket.room
            }, {
                $inc: {
                    peopleCount: -1
                }
            }, function() {});
            Room.update({
                _id: roomInfo.newRoomId
            }, {
                $inc: {
                    peopleCount: 1
                }
            }, function() {});
            Room.findOne({
                name: socket.room
            }, function(err, oldRoomInfo) {
                if (err) {
                    throw error;
                }
                Guest.findOne({
                    _id: "_" + socket.id.slice(2)
                }, function(err, userInfo) {
                    if (err) {
                        throw err;
                    }
                    Guest.find({
                        roomName: newRoomInfo.name
                    }, function(err, peopleFromNewRoom) {
                        if (err) {
                            throw err;
                        }
                        Message.find({
                            roomName: newRoomInfo.name
                        }, function(err, messagesFromNewRoom) {
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
                                }
                            });
                            socket.emit("notification", {
                                message: "Room has been changed successfully",
                                type: "general"
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
                            socket.broadcast.emit("notification", {
                                message: "User <span class='highlighted'>" + userInfo.name + "</span> joined <span class='highlighted'>" + newRoomInfo.name + "</span> room",
                                type: "general"
                            });
                            clients.emit("updatePeopleCounters", {
                                newRoomInfo: {
                                    _id: newRoomInfo._id,
                                    peopleCount: newRoomInfo.peopleCount + 1
                                },
                                oldRoomInfo: {
                                    _id: oldRoomInfo._id,
                                    peopleCount: oldRoomInfo.peopleCount
                                }
                            });
                            Guest.update({
                                _id: "_" + socket.id.slice(2)
                            }, {
                                $set: {
                                    roomName: newRoomInfo.name
                                }
                            }, function() {});
                        });
                    });
                });
            });
        }
    });
}

function deleteRoom(data) {
    Room.findOne({
        _id: data.roomId
    }, function(err, roomInfo) {
        if (err) {
            throw err;
        }
        if (roomInfo.code !== sha1(data.code)) {
            sendValidErrors(err, "room-password-modal", socket);
        } else {
            Guest.find({
                roomName: roomInfo.name
            }).count(function(err, peopleCountInDeletedRoom) {
                if (err) {
                    throw err;
                }
                Room.update({
                    name: "global"
                }, {
                    $inc: {
                        peopleCount: peopleCountInDeletedRoom
                    }
                }, function() {});
                Room.findOne({
                    name: "global"
                }, function(err, globalRoomInfo) {
                    if (err) {
                        throw err;
                    }
                    Guest.find({
                        roomName: roomInfo.name
                    }, function(err, peopleFromDeletedRoom) {
                        if (err) {
                            throw err;
                        }
                        Guest.update({
                            roomName: roomInfo.name
                        }, {
                            $set: {
                                roomName: "global"
                            }
                        }, {
                            multi: true
                        }, function() {});
                        Guest.find({
                            roomName: "global"
                        }, function(err, peopleFromGlobalRoom) {
                            if (err) {
                                throw err;
                            }
                            // if user isn't in the global room don't send people info to the client
                            Message.find({
                                roomName: "global"
                            }, function(err, messagesFromGlobalRoom) {
                                if (err) {
                                    throw err;
                                }
                                Guest.findOne({
                                    "_id": "_" + socket.id.slice(2)
                                }, function(err, user) {
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
                                    socket.broadcast.to(roomInfo.name).emit("notification", {
                                        message: "You have been transferred to the <span class'highlighted'>global</span> room",
                                        type: "general"
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
                                    socket.emit("notification", {
                                        message: "Room <span class='highlighted'>" + roomInfo.name + "</span> has been successfully deleted",
                                        type: "actionPerformed"
                                    });
                                    socket.broadcast.emit("notification", {
                                        message: "User <span class='highlighted'>" + user.name + "</span> has deleted <span class='highlighted'>" + roomInfo.name + "</span> room",
                                        type: "general"
                                    });
                                    clients.emit("deleteRoomItem", data.roomId);
                                    clients.emit("updatePeopleCounters", {
                                        newRoomInfo: {
                                            _id: globalRoomInfo._id,
                                            peopleCount: globalRoomInfo.peopleCount
                                        }
                                    });
                                    Room.remove({
                                        _id: data.roomId
                                    }, function() {});
                                    Message.remove({
                                        roomName: roomInfo.name
                                    }, function() {});
                                });
                            });
                        });
                    });
                });
            });
        }
    });
}

function searchRoom(searchPattern, currentRoomId, socket) {
    Room.find({
        $and: [{
            name: new RegExp('.*' + searchPattern + '.*', 'i')
        }, {
            _id: {
                $ne: currentRoomId
            }
        }]
    }, function(err, foundRooms) {
        if (err) {
            throw err;
        }
        socket.emit("searchRoom", foundRooms);
    });
}

function signup(userData, socket) {
    var user = new User({
        name: userData["name"],
        email: userData["email"],
        gender: userData["male"] ? userData["male"] : userData["female"],
        avatar: userData["avatarBase64"],
        roomName: "global"
    });
    user.setPassword(userData["password"], userData["confirm-password"]);
    user.save(function (err) {
        console.log(err);
        if (err) {
            sendValidErrors(err, "signup", socket);
        } else {
            login(user);
            socket.loggedIn = true;
            Room.update({
                name: "global"
            }, {
                $inc: {
                    peopleCount: 1
                }
            }, function(err, doc) {
                if (err) {
                    throw err;
                }
                // console.log(user);
                user.signedIn = true;
                populateChat(user, socket);
            });
        }
    });
}

mongoose.connect('mongodb://' + connection_string, function(err, db) {

    cleanDBAfterServerReload();

    app.get('/', function(req, res) {
        res.sendFile(__dirname + '/build/index.html');
    });

    app.get('/niko', function(req, res) {
        res.sendFile(__dirname + '/build/index1.html');
    });

    clients.on('connection', function(socket) {

        socket.on("message", function(text) {
            addMessage(text, socket);
        });

        socket.on("changeDefaultAvatar", function(gender) {
            // @TODO Check if gender pic exists
            socket.emit("changeDefaultAvatar", "images/" + gender + ".jpg");
        });

        socket.on("enterAsGuest", function(guestData) {
            enterAsGuest(guestData, socket);
        });

        socket.on("signup", function(userData) {
            signup(userData, socket);
        });

        socket.on("login", function(userData) {
            login(userData);
        });

        socket.on("createRoom", function(roomInfo) {
            createRoom(roomInfo, socket);
        });

        socket.on("disconnect", function() {
            guestLeft(socket);
        });

        socket.on("changeRoom", function(roomInfo) {
            changeRoom(roomInfo, socket);
        });

        socket.on("deleteRoom", function(data) {
            deleteRoom(data, socket);
        });

        socket.on("searchRoom", function(data) {
            searchRoom(data.searchPattern, data.currentRoomId, socket);
        });

        socket.on("startTyping", function(id) {
            socket.broadcast.to(socket.room).emit("startTyping", id);
        });

        socket.on("stopTyping", function(id) {
            socket.broadcast.to(socket.room).emit("stopTyping", id);
        });

    });
});
