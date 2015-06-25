window.onload = function() {
	/*function populateSidebar(data, type, size) {
		var section = document.createElement('section');
		var div = document.createElement('div');
		section.appendChild(div);
		if (size != 'small') {
			section.firstChild.innerHTML = '<img src="images/' + type + '.svg" class="' + type + 'Icon" alt="' + type + '">' + type;
		} else {
			section.firstChild.innerHTML = type;
		}
		var ul = document.createElement('ul');
		section.appendChild(ul);
		var i, li;
		if (type == 'rooms') {
			section.className = 'block-list roomsSidebar';
			for(i = 0; i < data.length; ++i) {
				li = document.createElement('li');
				li.className = 'roomName';
				li.innerHTML = '<span>' + data[i].name + '</span> <span>' + data[i].peopleCount + '</span>';
				section.lastChild.appendChild(li);
			}
		} else {
			section.className = 'block-list peopleSidebar';
			for(i = 0; i < data.length; ++i) {
				li = document.createElement('li');
				li.setAttribute('id', data[i].name);
				li.innerHTML = data[i].name;
				section.lastChild.appendChild(li);
			}
		}
		return section;
	}*/

	function addPerson(name) {
		var li = document.createElement('li');
		li.textContent = name;
		li.className = name;
		if (elements.peopleList[0].firstChild !== null) {
			elements.peopleList[0].insertBefore(li, elements.peopleList[0].firstChild);
			elements.peopleList[1].insertBefore(li.cloneNode(true), elements.peopleList[1].firstChild);
		} else {
			elements.peopleList[0].appendChild(li);
			elements.peopleList[1].appendChild(li.cloneNode(true));
		}
	}

	function deletePerson(personId) {
		var nodeToDelete = getNode('.' + personId, true);
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
			peopleList:           getNode('.peopleSidebar ul', true),
			peopleSidebar:        getNode('.peopleSidebar'),
			roomsSidebar:         getNode('.roomsSidebar'),
			roomsSidebarSmall:    getNode('.roomsSidebarSmall'),
			peopleSidebarSmall:   getNode('.peopleSidebarSmall'),
			roomsSidebarContent:  getNode('.roomsSidebar section'),
			peopleSidebarContent: getNode('.peopleSidebar section'),
			rooms:                getNode('.roomsSidebar ul li', true),
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

	for(var i = 0; i < elements.rooms.length; ++i) {
		elements.rooms[i].addEventListener('click', changeRoomHandler);
	}

	socket.on('changeRoom', function(data) {
		// var li;
		if (data.people) {
			elements.peopleList[0].innerHTML = '';
			elements.peopleList[1].innerHTML = '';
			if (data.people.length !== 0) {
				addPerson(data.people[0].name);
				// li = document.createElement('li');
				// li.textContent = data.people[0];
				// li.className = data.people[0];
				// elements.peopleList[0].appendChild(li);
				// elements.peopleList[1].appendChild(li.cloneNode(true));
				for(var i = 1; i < data.people.length; ++i) {
					addPerson(data.people[i].name);
					// li = document.createElement('li');
					// li.textContent = data.people[i];
					// li.className = data.people[i];
					// elements.peopleList[0].insertBefore(li, peopleList[0].firstChild);
					// elements.peopleList[1].insertBefore(li.cloneNode(true), peopleList[1].firstChild);
				}
			}
			addPerson(data.name + '(you)');
			// li = document.createElement('li');
			// li.textContent = data.name + '(you)';
			// elements.peopleList[0].insertBefore(li, peopleList[0].firstChild);
			// elements.peopleList[1].insertBefore(li.cloneNode(true), peopleList[1].firstChild);
		} else {
			if (data.whoLeftId) {
				deletePerson(data.whoLeftId);
				// var nodeToDelete = getNode('.' + data.whoLeft, true);
				// nodeToDelete[0].parentNode.removeChild(nodeToDelete[0]);
				// nodeToDelete[1].parentNode.removeChild(nodeToDelete[1]);
			} else {
				addPerson(data.name);
				// li = document.createElement('li');
				// li.textContent = data.name;
				// li.className = data.name;
				// elements.peopleList[0].insertBefore(li, peopleList[0].firstChild);
				// elements.peopleList[1].insertBefore(li.cloneNode(true), peopleList[1].firstChild);
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
		// var li = document.createElement('li');
		// li.textContent = data.name;
		if (data.message) {
			// li.className = data.name;
			toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000 });
		}
		addPerson(data.name);
		// if (elements.peopleList[0].firstChild == null) {
		// 	addPerson(data, data.name);
		// } else {
		// 	addPerson(data, true);
		// }
	});

	socket.on('userIsTyping', function(data) {
		// var li = getNode('.' + data.userId);
		var li = getNode('.' + data.name);
		var img = document.createElement('img');
		img.src = 'images/pen.gif';
		li.appendChild(img);
	});

	socket.on('userStopTyping', function(data) {
		// var li = getNode('.' + data.userId);
		var li = getNode('.' + data.name);
		li.removeChild(li.lastChild);
	});

	socket.on('warning', function(data) {
		toastr.warning(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000 });
	});

	socket.on('message', function(data) {
		for(var i = 0; i < data.length; ++i) {
			var messageContent = document.createElement('div');
			messageContent.innerHTML = '<h4>' + data[i].name + '</h4>' + '<p>' + data[i].message + '</p><hr>';
			if (elements.messageDiv.firstChild === null) {
				elements.messageDiv.appendChild(messageContent);
			} else {
				elements.messageDiv.insertBefore(messageContent, elements.messageDiv.firstChild);
			}
		}
	});

	socket.on('left', function(data) {
		deletePerson(data);
		toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000 });
	});

	elements.showModalButton.dispatchEvent(new MouseEvent('click'));
	elements.nameInput.focus();

	elements.nameInput.addEventListener('keyup', function(e) {
		if (e.keyCode == 13) {

			elements.closeModalButton.dispatchEvent(new MouseEvent('click'));
			// nameBlock.textContent = (e.target.value != '') ? e.target.value : 'Guest'; // use reg exp

			socket.emit('joined', { name: elements.nameInput.value });

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