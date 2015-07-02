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

			socket.broadcast.emit('joined', { user: user, message: user.name + ' joined chat.' });
			user.name += '(you)';
			socket.emit('joined', { user: user });
		});

		socket.on('left', function() {
			people.find({ _id: '_' + socket.id }).toArray(function(err, users) {
				if (err) return err;

				var whoLeft = users[0];
				client.in(whoLeft.room).emit('left', { user: whoLeft, message: whoLeft.name + 'left chat.' });
				people.remove({ _id: whoLeft._id });
			});
		});

		socket.on('createRoom', function(data) {

			var whitespacePattern = /^\s*$/;

			if (whitespacePattern.test(data.roomName)) {
				socket.emit('warning', { message: 'Room name should not be empty!' });
				return;
			}

			people.find({ _id: '_' + socket.id }).toArray(function(err, users) {

				var user = users[0];

				var room = {
					_id:         '_' + uuid.v1(),
					name:        data.roomName,
					password:    data.roomPassword,
					creatorId:   user._id,
					peopleCount: 0
				};

				rooms.insert(room);

				socket.emit('createRoom', { room: room });
				socket.broadcast.emit('createRoom', { room: room, message: user.name + ' added public room "' + data.roomName + '"' });
			});
		});

		socket.on('changeRoom', function(data) {
			people.find({ _id: '_' + socket.id }).toArray(function(err, users) {
				if (err) return err;

				var user = users[0];

				socket.broadcast.to(user.room).emit('changeRoom', { message: user.name + ' left room', whoLeft: user });
				socket.leave(user.room);
				client.in(data.newRoom).emit('changeRoom', { user: user, message: user.name + ' joined room' });

				user.name += '(you)';

				people.find({ room: data.newRoom }).toArray(function(err, users) {
					if (err) return err;

					messages.find({ room: data.newRoom }).toArray(function(err, messages) {
						if (err) return err;

						socket.emit('changeRoom', { user: user, people: users, messages: messages });
						socket.join(data.newRoom);
						people.update({ _id: user._id }, { $set: { room: data.newRoom } });
					});
				});
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
					date: new Date().toLocaleString().replace(/[PM,]/g, '')
				};

				messages.insert(message);

				client.in(user.room).emit('message', message);
			});
		});
	});
});