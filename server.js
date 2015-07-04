var mongo   = require('mongodb').MongoClient;
var io      = require('socket.io');
var express = require('express');
var uuid    = require('node-uuid');
var jade    = require('jade');
var app     = express();
var server  = app.listen(3000);
var client  = io.listen(server);

app.use(express.static(__dirname + '/build/assets'));

mongo.connect('mongodb://127.0.0.1:27017/chat', function(err, db) {

	var rooms    = db.collection('rooms');
	var people   = db.collection('people');
	var messages = db.collection('messages');

	app.get('/', function(req, res) {
		var html = jade.renderFile(__dirname + '/build/index.jade');
		res.send(html);
	});

	client.on('connection', function(socket) {

		socket.join('global');

		socket.on('populateChat', function() {
			rooms.find().toArray(function(err, roomsData) {
				if (err) return err;

				people.find({ room: 'global' }).toArray(function(err, peopleData) {
					if (err) return err;

					messages.find({ room: 'global' }).toArray(function(err, messagesData) {
						if (err) return err;

						socket.emit('populateChat', roomsData, peopleData, messagesData);
					});
				});
			});
		});

		socket.on('joined', function(userName) {

			var whitespacePattern = /^\s*$/;
			userName = userName.trim();

			if (whitespacePattern.test(userName)) {
				socket.emit('warning', { message: 'Name should not be empty!' });
				return;
			}

			var user = {
				_id: '_' + socket.id,
				name: userName,
				room: 'global',
				isTyping: false
			};

			people.insert(user);
			rooms.update({ name: 'global' }, { $inc: { peopleCount: 1 } });
			rooms.find({ name: 'global' }).toArray(function(err, roomsData) {
				var room = roomsData[0];

				socket.broadcast.emit('joined', { room: room, user: user, message: user.name + ' joined chat.' });
				user.name += '(you)';
				socket.emit('joined', { room: room, user: user });
			});
		});

		socket.on('left', function() {
			people.find({ _id: '_' + socket.id }).toArray(function(err, users) {
				if (err) return err;

				var whoLeft = users[0];

				rooms.update({ name: whoLeft.room }, { $inc: { peopleCount: -1 } });

				rooms.find({ name: whoLeft.room }).toArray(function(err, roomsData) {
					var room = roomsData[0];
					client.in(whoLeft.room).emit('left', { room: room, user: whoLeft, message: whoLeft.name + 'left chat.' });
					people.remove({ _id: whoLeft._id });
				});
			});
		});

		socket.on('createRoom', function(data) {

			var whitespacePattern = /^\s*$/;

			if (whitespacePattern.test(data.roomName)) {
				socket.emit('warning', { message: 'Room name should not be empty!' });
				return;
			}

			if (data.roomPassword !== data.roomPasswordRepeat) {
				socket.emit('warning', { roomName: data.roomName, message: 'Password confirmation doesn\'t match password!' });
				return;
			}

			if (data.roomCode !== data.roomCodeRepeat) {
				socket.emit('warning', { roomName: data.roomName, message: 'Room code confirmation doesn\'t match room code!' });
				return;
			}

			var roomType = 'public';
			if (data.roomPassword !== '') {
				roomType = 'private';
			}

			people.find({ _id: '_' + socket.id }).toArray(function(err, users) {

				var user = users[0];

				var room = {
					_id:         '_' + uuid.v1(),
					name:        data.roomName,
					password:    data.roomPassword,
					code:        data.roomCode,
					creatorId:   user._id,
					peopleCount: 0
				};

				rooms.insert(room);

				socket.emit('createRoom', { room: room });
				socket.broadcast.emit('createRoom', { room: room, message: user.name + ' added ' + roomType + ' room "' + data.roomName + '"' });
			});
		});

		socket.on('changeRoom', function(data) {
			rooms.find({ name: data.newRoom }).toArray(function(err, newRoomInfo) {
				newRoomInfo = newRoomInfo[0];
				if (newRoomInfo.password !== '' && data.newRoomPassword === undefined) {
					socket.emit('openRoomPasswordModal');
					return;
				} else {
					if (newRoomInfo.password !== '' && newRoomInfo.password !== data.newRoomPassword) {
						socket.emit('warning', { message: 'Room password is wrong!' });
						return;
					} else {
						var isRoomPrivate = false;
						if (data.newRoomPassword) {
							isRoomPrivate = true;
						}
						people.find({ _id: '_' + socket.id }).toArray(function(err, users) {
							if (err) return err;

							var user = users[0];

							socket.broadcast.to(user.room).emit('changeRoom', { message: user.name + ' left room', whoLeft: user });
							socket.leave(user.room);
							client.in(data.newRoom).emit('changeRoom', { user: user, message: user.name + ' joined room' });

							rooms.update({ name: user.room }, { $inc: { peopleCount: -1 } });
							rooms.update({ name: data.newRoom }, { $inc: { peopleCount: 1 } });
							newRoomInfo.peopleCount += 1;
							rooms.find({ name: user.room }).toArray(function(err, oldRoomInfo) {

								oldRoomInfo = oldRoomInfo[0];
								client.emit('changeRoom', { hello: 'world', oldRoomInfo: oldRoomInfo, newRoomInfo: newRoomInfo });

								user.name += '(you)';

								people.find({ room: data.newRoom }).toArray(function(err, users) {
									if (err) return err;

									messages.find({ room: data.newRoom }).toArray(function(err, messages) {
										if (err) return err;

										socket.emit('changeRoom', { oldRoomInfo: oldRoomInfo, newRoomInfo: newRoomInfo, 
																	isRoomPrivate: isRoomPrivate, people: users, messages: messages, user: user });
										socket.join(data.newRoom);
										people.update({ _id: user._id }, { $set: { room: data.newRoom } });
									});
								});
							});
						});
					}
				}
			});
		});

		socket.on('userIsTyping', function(room) {
			socket.broadcast.to(room).emit('userIsTyping', '_' + socket.id);
		});

		socket.on('userStopTyping', function(room) {
			socket.broadcast.to(room).emit('userStopTyping', '_' + socket.id);
		});

		socket.on('message', function(data) {
			var whitespacePattern = /^\s*$/;

			if (whitespacePattern.test(data.message)) {
				socket.emit('warning', { message: 'Message should not be empty!' });
				return;
			}

			people.find({ _id: '_' + socket.id }).toArray(function(err, users) {
				if (err) return err;

				var user = users[0];

				var message = {
					_id: '_' + uuid.v1(),
					author: user.name,
					text: data.message,
					room: user.room,
					date: new Date().toLocaleString().replace(/[PMA,]/g, '')
				};

				messages.insert(message);

				client.in(user.room).emit('message', message);
			});
		});
	});
});