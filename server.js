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
			var user = {
				id: '_' + socket.id,
				name: userName,
				room: 'global',
				isTyping: false
			};

			people.insert(user);

			socket.broadcast.emit('joined', { user: user, message: user.name + ' joined chat.' });
			user.name += '(you)';
			socket.emit('joined', { user: user });
			socket.join('global');
		});

		socket.on('left', function() {
			people.find({ id: '_' + socket.id }).toArray(function(err, users) {
				if (err) return err;

				var whoLeft = users[0];
				client.in(whoLeft.room).emit('left', { user: whoLeft, message: whoLeft.name + 'left chat.' });
				people.remove({ id: whoLeft.id });
			});
		});

		socket.on('changeRoom', function(data) {
			people.find({ id: '_' + socket.id }).toArray(function(err, users) {
				if (err) return err;

				var user = users[0];

				if (data.roomName == user.room) {
					return;
				}

				socket.broadcast.to(user.room).emit('changeRoom', { message: user.name + ' left room', whoLeft: user });
				socket.leave(user.room);
				client.in(data.roomName).emit('changeRoom', { user: user, message: user.name + ' joined room' });

				user.name += '(you)';

				people.find({ room: data.roomName }).toArray(function(err, users) {
					if (err) return err;

					messages.find({ room: data.roomName }).toArray(function(err, messages) {
						if (err) return err;

						socket.emit('changeRoom', { user: user, people: users, messages: messages });
						socket.join(data.roomName);
						people.update({ id: user.id }, { $set: { room: data.roomName } });
					});
				});
			});
		});

		socket.on('userIsTyping', function() {
			var user = people.find({ id: '_' + socket.id });
			socket.broadcast.in(user.room).emit('userIsTyping', { userId: user.id });
		});

		socket.on('userStopTyping', function() {
			var user = people.find({ id: '_' + socket.id });
			socket.broadcast.in(user.room).emit('userStopTyping', { userId: user.id });
		});

		socket.on('message', function(data) {
			var whitespacePattern = /^\s*$/;

			if (whitespacePattern.test(data.message)) {
				socket.emit('warning', { message: 'Message should not be empty!' });
				return;
			}

			people.find({ id: '_' + socket.id }).toArray(function(err, users) {
				if (err) return err;

				var user = users[0];

				var message = {
					id: '_' + uuid.v1(),
					author: user.name,
					text: data.message,
					room: user.room,
					date: new Date().toJSON().slice(0, 10)
				};

				messages.insert(message);

				client.in(user.room).emit('message', message);
			});
		});
	});
});