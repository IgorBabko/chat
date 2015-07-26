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

					// for(var user in peopleData) {
					// 	if (user.status === 'doctor') {
					// 		user.name += '(doctor)';
					// 	}
					// }

					messages.find({ room: 'global' }).toArray(function(err, messagesData) {
						if (err) return err;

						socket.emit('populateChat', roomsData, peopleData, messagesData);
					});
				});
			});
		});

		socket.on('joined', function(userData) {

			var whitespacePattern = /^\s*$/;
			userData.userName = userData.userName.trim();

			if (whitespacePattern.test(userData.userName)) {
				socket.emit('warning', { message: 'Name should not be empty!' });
				return;
			}

			var status = 'patient';
			if (userData.identificationCode !== '' && userData.identificationCode !== '1') {
				socket.emit('warning', { identificationCode: ' ', message: 'Identification code is wrong!' });
				return;
			} else if (userData.identificationCode === '1') {
				status = 'doctor';
			}

			var user = {
				_id: '_' + socket.id,
				name: userData.userName,
				room: 'global',
				status: status
				// isTyping: false
			};

			people.insert(user);
			rooms.update({ name: 'global' }, { $inc: { peopleCount: 1 } });
			rooms.find({ name: 'global' }).toArray(function(err, roomsData) {
				var room = roomsData[0];

				var userName = user.name;
				if (user.status === 'doctor') {
					user.name += '(doctor)';
				}
				socket.broadcast.emit('joined', { room: room, user: user, message: user.name + ' joined chat.' });
				user.name = userName + '(you)';
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
								client.emit('changeRoom', { forAllClients: true, oldRoomInfo: oldRoomInfo, newRoomInfo: newRoomInfo });

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

		socket.on('removeRoom', function(data) {
			if (typeof data === 'string') {
				people.find({ room: data }).count(function(error, peopleInRoom) {
					socket.emit('removeRoom', { peopleCount: peopleInRoom - 1 });
					return;
				});
			} else {
				rooms.find({ room: data.activeRoomName }).toArray(function(err, roomsInfo) {
					var room = roomsInfo[0];
					if (!room.code && data.code !== '' || room.code && room.code !== data.code) {
						socket.emit('warning', { message: 'Room code is wrong!' });
						return;
					}
					client.emit('removeRoom', { message: 'Room "' + data.activeRoomName + '" has been deleted.' });
					people.broadcast.to(data.activeRoomName).emit('removeRoom', { message: 'You have been transfered to global room.'});
					people.update({ room: data.activeRoomName }, { $set: { room: 'global' } });
				});
			}
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