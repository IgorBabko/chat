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
    connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" + process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" + process.env.OPENSHIFT_MONGODB_DB_HOST + ':' + process.env.OPENSHIFT_MONGODB_DB_PORT + '/' + process.env.OPENSHIFT_APP_NAME;
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

function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches.length !== 3) {
        return new Error('Invalid input string');
    } else {
        console.log(matches[1]);
        return new Buffer(matches[2], 'base64');
    }
}

function populateChat(guestData, socket) {
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
                    $ne: guestData._id
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
                // insert joined user - incognito
                // User.insert({
                //     _id: "_" + socket.id.slice(2),
                //     username: username,
                //     roomName: "global"
                // });
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
                        // console.log("nikkkkkkkk");
                        socket.join("global");
                        socket.room = "global";
                        socket.emit("enterAsGuest", {
                            _id: guestData._id,
                            name: guestData.name,
                            myself: true,
                            globalRoomId: globalRoomInfo._id
                        });
                        socket.emit("notification", {
                            message: "Welcome, <span class='highlighted'>" + guestData.name + "</span>!",
                            type: "actionPerformed"
                        });
                        socket.broadcast.to("global").emit("enterAsGuest", {
                            _id: guestData._id,
                            name: guestData.name
                        });
                        socket.broadcast.emit("notification", {
                            message: "User <span class='highlighted'>" + guestData.name + "</span> has joined the chat",
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
// join functions (login, signup, incognito)
function enterAsGuest(guestData, socket) {
    // username = username.trim();
    // User.findOne({ name: userData.username }, function (err, userWithSameName) {
    // if (err) {
    // throw err;
    // }
    // var errors = {};
    // if (userWithSameName != null) {
    // errors.username = "Username already exists!";
    // console.log("1");
    // } else if (whitespacePattern.test(username)) {
    // errors.username = "Username should not be empty!";
    // console.log("2");
    // }
    // if (!userData.isIncognito) {
    //     userData.isIncognito = false;
    // }
    guestData._id = "_" + socket.id.slice(2);
    guestData.roomName = "global";
    var guest = new Guest(guestData);
    // console.log("validdd" + guest.validateSync().toString());
    // console.log("guest" + guest);
    guest.save(function(err) {
        // console.log("afterSave");
        // console.log("errors" + err);
        // console.log(err.errors);
        // console.log(String(err.errors.color));
        // console.log(err.errors.color.kind);
        // console.log(err.errors.color.path);
        // console.log(err.errors.color.value);
        // console.log(err.name);
        // console.log(err.message);
        // if ((Object.keys(errors).length !== 0)) {
        // console.log(Object.keys(errors).length);
        // socket.emit("validErrors", {
        //     modalId: "enter-chat-modal",
        //     errors: errors
        // });
        // return;
        if (!err) {
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
        } else {
            var errors = err.errors;
            var errorMessages = {};
            for (var field in errors) {
                if (errors.hasOwnProperty(field)) {
                    errorMessages[field] = errors[field].message
                   console.log(errors[field].message);
                }
            }
            socket.emit("validErrors", {
                modalId: "enter-chat-modal",
                errors: errorMessages
            });
        }
    });
}
mongoose.connect('mongodb://' + connection_string, function(err, db) {
    // var rooms = db.collection('rooms');
    // var people = db.collection('people');
    // var messages = db.collection('messages');
    Guest.remove(function (){});
    Room.update({}, {
        $set: {
            peopleCount: 0
        }
    }, {
        multi: true
    }, function (){});
    app.get('/', function(req, res) {
        res.sendFile(__dirname + '/build/index.html');
    });
    app.get('/niko', function(req, res) {
        res.sendFile(__dirname + '/build/index1.html');
    });
    // var whitespacePattern = /^\s*$/;
    // function isEmpty(value) {
    //     return whitespacePattern.test(value);
    // }
    clients.on('connection', function(socket) {
        //socket.emit("populateChat", {roomsInfo: rooms.find()});
        socket.on("message", function(text) {
            if (whitespacePattern.test(text.trim())) {
                socket.emit("notification", {
                    message: "Message should not be empty",
                    type: "validErrors"
                });
            } else {
                people.findOne({
                    _id: "_" + socket.id.slice(2)
                }, function(err, author) {
                    if (err) {
                        throw err;
                    }
                    var message = {
                        author: author.name,
                        postedDate: new Date().toISOString(),
                        text: text.linkify(),
                        room: socket.room
                    };
                    messages.insert(message);
                    socket.broadcast.to(socket.room).emit("message", message);
                    message.myself = true;
                    socket.emit("message", message);
                });
            }
        });
        socket.on("changeDefaultAvatar", function(gender) {
            // @TODO Check if gender pic exists
            socket.emit("changeDefaultAvatar", "images/" + gender + ".jpg");
        });
        socket.on("enterAsGuest", function(guestData) {
            enterAsGuest(guestData, socket);
        });
        socket.on("signup", function(userData) {
            // fs.writeFileSync(userData.username + ".png", decodeBase64Image(data.avatarBase64));
            signup(userData);
        });
        socket.on("login", function(userData) {
            login(userData);
        });
        socket.on("createRoom", function(roomInfo) {
            var errors = {};
            rooms.findOne({
                name: roomInfo["room-name"]
            }, function(err, roomWithSameName) {
                if (err) {
                    throw err;
                }
                if (roomWithSameName != null) {
                    errors["room-name"] = "Room with same name already exists!";
                } else if (whitespacePattern.test(roomInfo["room-name"])) {
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
                    socket.emit("validErrors", {
                        modalId: "create-room-modal",
                        errors: errors
                    });
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
                    people.findOne({
                        _id: "_" + socket.id.slice(2)
                    }, function(err, userInfo) {
                        if (err) {
                            throw err;
                        }
                        socket.emit('createRoom', {
                            roomInfo: roomInfo
                        });
                        socket.emit("notification", {
                            message: "Room <span class='highlighted'>" + roomInfo.name + "</span> has been created successfully",
                            type: "actionPerformed"
                        });
                        socket.broadcast.emit('createRoom', {
                            roomInfo: roomInfo
                        });
                        socket.broadcast.emit("notification", {
                            message: "User <span class='highlighted'>" + userInfo.name + "</span> has created the room <span class='highlighted'>" + roomInfo.name + "</span>",
                            type: "general"
                        });
                    });
                }
            });
        });

        function guestLeft() {
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
                            }, function (err) {
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
        // socket.on("left", userLeftHandler);
        socket.on("disconnect", guestLeft);
        socket.on("changeRoom", function(data) {
            rooms.findOne({
                _id: data.newRoomId
            }, function(err, newRoomInfo) {
                if (err) {
                    throw err;
                }
                if (newRoomInfo.password !== sha1(data.password)) {
                    socket.emit("validErrors", {
                        modalId: "room-password-modal",
                        errors: {
                            "password": "Password is wrong!"
                        }
                    });
                } else {
                    rooms.update({
                        name: socket.room
                    }, {
                        $inc: {
                            peopleCount: -1
                        }
                    });
                    rooms.update({
                        _id: data.newRoomId
                    }, {
                        $inc: {
                            peopleCount: 1
                        }
                    });
                    rooms.findOne({
                        name: socket.room
                    }, function(err, oldRoomInfo) {
                        if (err) {
                            throw error;
                        }
                        people.findOne({
                            _id: "_" + socket.id.slice(2)
                        }, function(err, userInfo) {
                            if (err) {
                                throw err;
                            }
                            people.find({
                                room: newRoomInfo.name
                            }).toArray(function(err, peopleFromNewRoom) {
                                if (err) {
                                    throw err;
                                }
                                messages.find({
                                    room: newRoomInfo.name
                                }).toArray(function(err, messagesFromNewRoom) {
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
                                    people.update({
                                        _id: "_" + socket.id.slice(2)
                                    }, {
                                        $set: {
                                            room: newRoomInfo.name
                                        }
                                    });
                                });
                            });
                        });
                    });
                }
            });
        });
        socket.on("deleteRoom", function(data) {
            rooms.findOne({
                _id: data.roomId
            }, function(err, roomInfo) {
                if (err) {
                    throw err;
                }
                if (roomInfo.code !== sha1(data.code)) {
                    socket.emit("validErrors", {
                        modalId: "room-password-modal",
                        errors: {
                            "code": "Code is wrong!"
                        }
                    });
                } else {
                    people.find({
                        room: roomInfo.name
                    }).count(function(err, peopleCountInDeletedRoom) {
                        if (err) {
                            throw err;
                        }
                        rooms.update({
                            name: "global"
                        }, {
                            $inc: {
                                peopleCount: peopleCountInDeletedRoom
                            }
                        });
                        rooms.findOne({
                            name: "global"
                        }, function(err, globalRoomInfo) {
                            if (err) {
                                throw err;
                            }
                            people.find({
                                room: roomInfo.name
                            }).toArray(function(err, peopleFromDeletedRoom) {
                                if (err) {
                                    throw err;
                                }
                                people.update({
                                    room: roomInfo.name
                                }, {
                                    $set: {
                                        room: "global"
                                    }
                                }, {
                                    multi: true
                                });
                                people.find({
                                    room: "global"
                                }).toArray(function(err, peopleFromGlobalRoom) {
                                    if (err) {
                                        throw err;
                                    }
                                    // if user isn't in the global room don't send people info to the client
                                    messages.find({
                                        "room": "global"
                                    }).toArray(function(err, messagesFromGlobalRoom) {
                                        if (err) {
                                            throw err;
                                        }
                                        people.findOne({
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
                                            rooms.deleteOne({
                                                _id: data.roomId
                                            });
                                            messages.remove({
                                                room: roomInfo.name
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                }
            });
        });
        socket.on("startTyping", function(id) {
            socket.broadcast.to(socket.room).emit("startTyping", id);
        });
        socket.on("stopTyping", function(id) {
            socket.broadcast.to(socket.room).emit("stopTyping", id);
        });
    });
});