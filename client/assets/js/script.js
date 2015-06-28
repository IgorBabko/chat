window.onload = function() {

	function addListItem(lists, itemData, type) {
		var li = document.createElement('li');
		li.className = itemData.id;
		if (type === 'room') {
			li.innerHTML = '<span>' + itemData.name + '</span> <span>' + itemData.peopleCount + '</span>';
		} else {
			li.innerHTML = itemData.name;
		}
		if (lists[0].firstChild !== null) {
			lists[0].insertBefore(li, lists[0].firstChild);
			lists[1].insertBefore(li.cloneNode(true), lists[1].firstChild);
		} else {
			lists[0].appendChild(li);
			lists[1].appendChild(li.cloneNode(true));
		}
	}

	function addMessage(messageDiv, data) {
		var message = document.createElement('div');
		message.innerHTML = '<h4>' + data.author + ' <em>' + data.date + '</em></h4><p>' + data.text + '</p><hr>';

		if (messageDiv.firstChild !== null) {
			messageDiv.insertBefore(message, messageDiv.firstChild);
		} else {
			messageDiv.appendChild(message);
		}
	}

	function removeListItem(userId) {
		var nodeToDelete = getNode('.' + userId, true);
		nodeToDelete[0].parentNode.removeChild(nodeToDelete[0]);
		nodeToDelete[1].parentNode.removeChild(nodeToDelete[1]);
	}

	function changeRoomHandler() {
		socket.emit('changeRoom', { roomName: this.firstChild.textContent });
	}

	function transformSidebarsForSmallScreenSizes() {
		if (window.outerWidth <= 640 && isScreenLarge) {
			isScreenLarge = false;
		} 
		if (window.outerWidth > 640 && !isScreenLarge) {
			isScreenLarge = true;
			panelHandler();
		}
	}

	function getNode(selector, selectAll) {
		if (selectAll) {
			return document.querySelectorAll(selector);
		} else {
			return document.querySelector(selector);
		}
	}

	function getElements() {
		var elements = {
			showModalButton:      getNode('#showModalButton'),
			messageInput:         getNode('.message-input input'),
			messageDiv:           getNode('#messages'),
			nameInput:            getNode('#name'),
			closeModalButton:     getNode('#closeModalButton'),
			header:               getNode('.header'),
			roomLists:            getNode('.roomsSidebar ul', true),
			peopleLists:          getNode('.peopleSidebar ul', true),
			peopleSidebar:        getNode('.peopleSidebar'),
			roomsSidebar:         getNode('.roomsSidebar'),
			roomsSidebarSmall:    getNode('.roomsSidebarSmall'),
			peopleSidebarSmall:   getNode('.peopleSidebarSmall'),
			roomsSidebarContent:  getNode('.roomsSidebar section'),
			peopleSidebarContent: getNode('.peopleSidebar section'),
			roomsButton:          getNode('.header img:nth-child(1)'),
			peopleButton:         getNode('.header img:nth-child(2)'),
			roomsIcon:            getNode('.roomsIcon'),
			peopleIcon:           getNode('.peopleIcon')
		};
		return elements;
	}

	var elements = getElements();

	elements.messageInput.addEventListener('focus', function() {
		socket.emit('userIsTyping');
	});

	elements.messageInput.addEventListener('blur', function() {
		socket.emit('userStopTyping');
	});

	var isScreenLarge = window.outerWidth > 640 ? true: false;

	function panelHandler() {
		if (roomsOpened) {
			elements.roomsButton.dispatchEvent(new MouseEvent('click'));
		}
		if (peopleOpened) {
			elements.peopleButton.dispatchEvent(new MouseEvent('click'));
		}
	}

	var socket = io();
	transformSidebarsForSmallScreenSizes();

	socket.emit('populateChat');
	socket.on('populateChat', function(rooms, people, messages) {
		var i;
		for(i = 0; i < rooms.length; ++i) {
			addListItem(elements.roomLists, rooms[i], 'room');
		}

		for(i = 0; i < messages.length; ++i) {
			addMessage(elements.messageDiv, messages[i]);
		}

		for(i = 0; i < people.length; ++i) {
			addListItem(elements.peopleLists, people[i]);
		}

		elements.rooms = getNode('.roomsSidebar ul li', true);
		for(i = 0; i < elements.rooms.length; ++i) {
			elements.rooms[i].addEventListener('click', changeRoomHandler);
		}
	});


	socket.on('changeRoom', function(data) {
		if (data.people) {
			var i;
			elements.peopleLists[0].innerHTML = '';
			elements.peopleLists[1].innerHTML = '';
			elements.messageDiv.innerHTML = '';
			if (data.people.length !== 0) {
				for(i = 0; i < data.people.length; ++i) {
					addListItem(elements.peopleLists, data.people[i]);
				}
			}
			if (data.messages.length !== 0) {
				for(i = 0; i < data.messages.length; ++i) {
					addMessage(elements.messageDiv, data.messages[i]);
				}
			}
			addListItem(elements.peopleLists, data.user);
		} else {
			if (data.whoLeft) {
				removeListItem(data.whoLeft.id);
			} else {
				addListItem(elements.peopleLists, data.user);
			}
			toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000 });
		}
	});

	window.addEventListener('resize', function() {
		transformSidebarsForSmallScreenSizes();
	});

	elements.header.addEventListener('click', panelHandler);
	elements.messageDiv.addEventListener('click', panelHandler);
	elements.messageInput.addEventListener('click', panelHandler);
	document.addEventListener('keyup', function(e) {
		if (e.keyCode == 27) {
			panelHandler(e);
		}
	});

	var roomsOpened = false, peopleOpened = false;

	elements.roomsButton.addEventListener('click', function(e) {
		roomsOpened = !roomsOpened;
		e.stopPropagation();
	});

	elements.peopleButton.addEventListener('click', function(e) {
		peopleOpened = !peopleOpened;
		e.stopPropagation();
	});

	socket.on('joined', function(data) {
		console.log('joined');
		if (data.message) {
			toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000 });
		}
		addListItem(elements.peopleLists, data.user);
	});

	socket.on('userIsTyping', function(user) {
		// var li = getNode('.' + data.userId);
		var li = getNode('.' + user.id);
		var img = document.createElement('img');
		img.src = 'images/pen.gif';
		li.appendChild(img);
	});

	socket.on('userStopTyping', function(user) {
		// var li = getNode('.' + data.userId);
		var li = getNode('.' + user.id);
		li.removeChild(li.lastChild);
	});

	socket.on('warning', function(data) {
		toastr.warning(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000 });
	});

	socket.on('message', function(message) {
		addMessage(elements.messageDiv, message);
	});

	socket.on('left', function(user) {
		removeListItem(user.id);
		toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000 });
	});

	elements.showModalButton.dispatchEvent(new MouseEvent('click'));
	elements.nameInput.focus();

	elements.nameInput.addEventListener('keyup', function(e) {
		if (e.keyCode == 13) {

			elements.closeModalButton.dispatchEvent(new MouseEvent('click'));
			// nameBlock.textContent = (e.target.value != '') ? e.target.value : 'Guest'; // use reg exp

			socket.emit('joined', elements.nameInput.value);

			elements.messageInput.addEventListener('keyup', function(e) {
				if (e.keyCode == 13) {
					socket.emit('message', { message: elements.messageInput.value });
					elements.messageInput.value = '';
				}
			});

			window.onunload = function() {
				socket.emit('left');
			};
		}
	});
};