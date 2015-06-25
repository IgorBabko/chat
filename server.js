var mongo   = require('mongodb').MongoClient;
var io      = require('socket.io');
var express = require('express');
var jade    = require('jade');
var app     = express();
var server  = app.listen(3000);
var client  = io.listen(server);

app.use(express.static(__dirname + '/build/assets'));

mongo.connect('mongodb://127.0.0.1:27017/chat', function(err, db) {

	var messages = [
		{
			id: '111',
			data: '02.12.12',
			text: '2kjindkfndklf'
		}
	];

	var rooms = {
					global: {
						peopleCount: 100,
						people: [
									{ id: '1', name: 'igor babko', isTyping: false },
									{ id: '2', name: 'jack', isTyping: false },
									{ id: '3', name: 'jessy' , isTyping: false},
									{ id: '4', name: 'rick'  , isTyping: false},
									{ id: '5', name: 'jeremy', isTyping: false},
									{ id: '1', name: 'igor babko' , isTyping: false},
									{ id: '2', name: 'jack'  , isTyping: false},
									{ id: '3', name: 'jessy' , isTyping: false},
									{ id: '4', name: 'rick'  , isTyping: false},
									{ id: '5', name: 'jeremy', isTyping: false},
									{ id: '1', name: 'igor babko' , isTyping: false},
									{ id: '2', name: 'jack'  , isTyping: false},
									{ id: '3', name: 'jessy' , isTyping: false},
									{ id: '4', name: 'rick'  , isTyping: false},
									{ id: '5', name: 'jeremy', isTyping: false}
														]
					},
					room1: {
						peopleCount: 2,
						people: [
									{id: '6', name: 'tom'},
									{id: '7', name: 'mike'},
									{id: '8', name: 'mikki'}
														]
					},
					room2: {
						peopleCount: 3,
						people: [
									{id: '9', name: 'cris'},
									{id: '10', name: 'totty'},
									{id: '11', name: 'lisa'}
														]
					},
					room3: {
						peopleCount: 4,
						people: [
									{id: '12', name: 'max'},
									{id: '13', name: 'victor'},
									{id: '14', name: 'carl'}
														]
					}
	};

	app.get('/', function(req, res) {
		var html = jade.renderFile(__dirname + '/build/index.jade', { rooms: rooms });
		res.send(html);
	});

	client.on('connection', function(socket) {

		var messagesCollection = db.collection('messages');

		messagesCollection.find().limit(100).sort({_id: 1}).toArray(function(err, data) {
			if (err) throw err;
			socket.emit('message', data);
		});

		socket.on('joined', function(data) {
			socket.name = data.name;
			socket.room = 'global';
			rooms.global.people.push(socket.name);
			socket.join('global');
			socket.emit('joined', { name: socket.name + '(you)' });
			socket.broadcast.emit('joined', { name: socket.name, message: socket.name + ' joined chat.' });
		});

		socket.on('changeRoom', function(data) {

			if (data.roomName == socket.room) {
				return;
			}

			var peopleInCurrentRoom = rooms[socket.room].people;

			peopleInCurrentRoom.splice(peopleInCurrentRoom.indexOf(socket.name), 1);
			socket.leave(socket.room);
			client.in(socket.room).emit('changeRoom', { message: socket.name + ' left room', whoLeftId: socket.name });
			socket.room = data.roomName;
			client.in(socket.room).emit('changeRoom', { name: socket.name, message: socket.name + ' joined room' });
			socket.join(socket.room);
			console.log(socket.name);
			// console.log(rooms[socket.room]);
			socket.emit('changeRoom', { name: socket.name, people: rooms[socket.room].people });
			rooms[socket.room].people.push(socket.name);
		});

		socket.on('userIsTyping', function() {
			socket.broadcast.in(socket.room).emit('userIsTyping', { userId: socket.name });
		});

		socket.on('userStopTyping', function() {
			socket.broadcast.in(socket.room).emit('userStopTyping', { userId: socket.name });
		});

		socket.on('message', function(data) {
			var whitespacePattern = /^\s*$/;
			if (whitespacePattern.test(data.message)) {
				socket.emit('warning', { message: 'Message should not be empty!' });
				return;
			}
			messagesCollection.insert({ name: socket.name, message: data.message });
			client.in(socket.room).emit('message', [{ name: socket.name, message: data.message }] );
		});

		socket.on('left', function(data) {
			var peopleInCurrentRoom = rooms[socket.room].people;
			peopleInCurrentRoom.splice(peopleInCurrentRoom.indexOf(socket.name), 1);
			client.in(socket.room).emit('left', { name: socket.name, message: socket.name + 'left chat.' });
			// if (socket.room == 'global') {
			// 	client.emit('left', { name: socket.name, message: socket.name + ' left chat.' });
			// } else {
			// }
		});
	});
});