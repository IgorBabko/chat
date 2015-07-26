window.onload = function() {

	function addListItem(lists, itemData, type) {
		var li = document.createElement('li');
		if (type === 'room') {
			li.className = itemData._id;
			if (itemData.name === 'global') {
				li.className += ' activeRoom';
			}
			if (itemData.password !== '') {
				li.innerHTML = '<span>' + itemData.name + '</span><img class="lock" src="/images/lock.png" >';
			} else {
				li.innerHTML = '<span>' + itemData.name + '</span> <span>' + itemData.peopleCount + '</span>';
			}
		} else {
			li.className = itemData._id;
			li.innerHTML = itemData.name;
		}
		var li2 = li.cloneNode(true);
		if (lists[0].firstChild !== null && type !== 'room') {
			lists[0].insertBefore(li, lists[0].firstChild);
			lists[1].insertBefore(li2, lists[1].firstChild);
		} else {
			lists[0].appendChild(li);
			lists[1].appendChild(li2);
		}

		return [li, li2];
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
		console.log('change room');
		if (this !== elements.activeRoom[0] && this !== elements.activeRoom[1]) {

			if (this.lastChild.className !== 'lock') {
				elements.activeRoom[0].classList.remove('activeRoom');
				elements.activeRoom[1].classList.remove('activeRoom');

				elements.activeRoom = getNode('.' + this.className, true);
				elements.activeRoom[0].classList.add('activeRoom');
				elements.activeRoom[1].classList.add('activeRoom');
			}

			activeRoomName = this.firstChild.textContent;

			socket.emit('changeRoom', { newRoom: activeRoomName });
		}
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

	function panelHandler() {
		if (roomsOpened) {
			elements.roomsButton.dispatchEvent(new MouseEvent('click'));
		}
		if (peopleOpened) {
			elements.peopleButton.dispatchEvent(new MouseEvent('click'));
		}
	}

	function updatePeopleCounters(roomInfo) {
		console.log('updatePeopleCounter');
		var peopleCounters = getNode('.' + roomInfo._id + ' :last-child', true);
		peopleCounters[0].innerHTML = roomInfo.peopleCount;
		peopleCounters[1].innerHTML = roomInfo.peopleCount;
	}

	function getElements() {
		var elements = {
			removeRoomModal:         getNode('#removeRoomModal'),
			showNewRoomModal:        getNode('.showNewRoomModal', true),
			showRemoveRoomModal:     getNode('.showRemoveRoomModal', true),
			closeRemoveRoomModal:    getNode('#closeRemoveRoomModal'),
			codeInput:               getNode('#code'),
			showRoomPasswordModal:   getNode('#showRoomPasswordModal'),
			closeRoomPasswordModal:  getNode('#closeRoomPasswordModal'),
			passwordInput:           getNode('#passwordInput'),
			roomNameField:           getNode('#roomName'),
			roomPasswordField:       getNode('#roomPassword'),
			roomPasswordRepeatField: getNode('#roomPasswordRepeat'),
			roomCodeField:           getNode('#roomCode'),
			roomCodeRepeatField:     getNode('#roomCodeRepeat'),
			showInputNameModal:      getNode('#showInputNameModal'),
			closeInputNameModal:     getNode('#closeInputNameModal'),
			closeNewRoomModal:       getNode('#closeNewRoomModal'),
			messageInput:            getNode('.message-input input'),
			messageDiv:              getNode('#messages'),
			nameInput:               getNode('#name'),
			identificationCodeInput: getNode('#identificationCode'),
			header:                  getNode('.header'),
			roomLists:               getNode('.roomsSidebar ul', true),
			peopleLists:             getNode('.peopleSidebar ul', true),
			peopleSidebar:           getNode('.peopleSidebar'),
			roomsSidebar:            getNode('.roomsSidebar'),
			roomsSidebarSmall:       getNode('.roomsSidebarSmall'),
			peopleSidebarSmall:      getNode('.peopleSidebarSmall'),
			roomsSidebarContent:     getNode('.roomsSidebar section'),
			peopleSidebarContent:    getNode('.peopleSidebar section'),
			roomsButton:             getNode('.header img:nth-child(1)'),
			peopleButton:            getNode('.header img:nth-child(2)'),
			roomsIcon:               getNode('.roomsIcon'),
			peopleIcon:              getNode('.peopleIcon')
		};
		return elements;
	}

	var elements = getElements();
	var activeRoomName = 'global';

	elements.messageInput.addEventListener('focus', function() {
		socket.emit('userIsTyping', activeRoomName);
	});

	elements.messageInput.addEventListener('blur', function() {
		socket.emit('userStopTyping', activeRoomName);
	});

	var isScreenLarge = window.outerWidth > 640 ? true: false;

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

		elements.rooms = getNode('.roomsSidebar ul li:not(.buttons)', true);
		for(i = 0; i < elements.rooms.length; ++i) {
			elements.rooms[i].addEventListener('click', changeRoomHandler);
		}

		elements.activeRoom = getNode('.activeRoom', true);
	});

	elements.passwordInput.addEventListener('keyup', function(e) {
		if (e.keyCode == 13) {
			socket.emit('changeRoom', { newRoom: activeRoomName, newRoomPassword: this.value });
			this.value = '';
		}
	});

	function newRoomFormSender(e) {
		if (e.keyCode == 13) {
			socket.emit('createRoom', { roomName: elements.roomNameField.value, roomPassword: elements.roomPasswordField.value,
										roomPasswordRepeat: elements.roomPasswordRepeatField.value, roomCode: elements.roomCodeField.value,
										roomCodeRepeat: elements.roomCodeRepeatField.value });
			elements.roomNameField.value = '';
			elements.roomPasswordField.value = '';
			elements.roomPasswordRepeatField.value = '';
			elements.roomCodeField.value = '';
		}
	}

	function removeRoomFormSender(e) {
		if (e.keyCode == 13) {
			socket.emit('removeRoom', { roomName: activeRoomName, code: elements.codeInput.value });
			elements.codeInput.value = '';
		}
	}

	elements.showNewRoomModal[0].addEventListener('click', function(e) {
		elements.roomNameField.focus();
	});

	elements.showNewRoomModal[1].addEventListener('click', function(e) {
		elements.roomNameField.focus();
	});

	elements.showRemoveRoomModal[0].addEventListener('click', function(e) {
		if (elements.pTag) {
			elements.codeInput.parentNode.removeChild(elements.pTag);
			elements.pTag = undefined;
		}
		socket.emit('removeRoom', activeRoomName);
		elements.codeInput.focus();
	});

	elements.showRemoveRoomModal[1].addEventListener('click', function(e) {
		if (elements.pTag) {
			elements.codeInput.parentNode.removeChild(elements.pTag);
			elements.pTag = undefined;
		}
		socket.emit('removeRoom', activeRoomName);
		elements.codeInput.focus();
	});

	elements.roomNameField.addEventListener('keyup', function(e) {
		newRoomFormSender(e);
	});

	elements.roomPasswordField.addEventListener('keyup', function(e) {
		newRoomFormSender(e);
	});

	elements.codeInput.addEventListener('keyup', function(e) {
		removeRoomFormSender(e);
	});

	socket.on('removeRoom', function(data) {
		console.log(data.peopleCount);
		if (data.peopleCount && data.peopleCount !== 0) {
			var pTag = document.createElement('p');
			pTag.style.color = 'red';
			pTag.innerHTML = 'There\'re <strong>' + data.peopleCount + '</strong> men at this room. When room gets removed all people will be moved to "global" room';
			elements.codeInput.parentNode.insertBefore(pTag, elements.codeInput);
			elements.pTag = pTag;
			return;
		}
		//if () {
			// message
		//}
	});

	socket.on('createRoom', function(data) {
		if (data.message) {
			toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000 });
		} else {
			elements.closeNewRoomModal.dispatchEvent(new MouseEvent('click'));
		}
		var newRoomItem = addListItem(elements.roomLists, data.room, 'room');

		newRoomItem[0].addEventListener('click', changeRoomHandler);
		newRoomItem[1].addEventListener('click', changeRoomHandler);
	});

	socket.on('openRoomPasswordModal', function() {
		elements.showRoomPasswordModal.dispatchEvent(new MouseEvent('click'));
		elements.passwordInput.focus();
	});

	elements.passwordInput.addEventListener('click', function(e) {
		if (e.keyCode == 13) {
			socket.emit('changeRoom', { password: this.value });
		}
	});

	socket.on('changeRoom', function(data) {
		if (data.forAllClients) {
			if (data.oldRoomInfo.password === '' || activeRoomName === data.oldRoomInfo.name) {
				updatePeopleCounters(data.oldRoomInfo);
			}
			if (data.newRoomInfo.password === '' || activeRoomName === data.newRoomInfo.name) {
				updatePeopleCounters(data.newRoomInfo);
			}
		} else if (data.people) {
			var lockImgs;
			if (data.isRoomPrivate) {
				elements.closeRoomPasswordModal.dispatchEvent(new MouseEvent('click'));
			}
			if (data.newRoomInfo.password !== '') {

				elements.activeRoom[0].classList.remove('activeRoom');
				elements.activeRoom[1].classList.remove('activeRoom');

				elements.activeRoom = getNode('.' + data.newRoomInfo._id, true);
				elements.activeRoom[0].classList.add('activeRoom');
				elements.activeRoom[1].classList.add('activeRoom');

				lockImgs = getNode('.' + data.newRoomInfo._id + ' .lock', true);
				var newRoomItems = [lockImgs[0].parentNode, lockImgs[1].parentNode];
				newRoomItems[0].removeChild(lockImgs[0]);
				newRoomItems[1].removeChild(lockImgs[1]);
				newRoomItems[0].appendChild(document.createElement('span'));
				newRoomItems[1].appendChild(document.createElement('span'));
			}
			updatePeopleCounters(data.newRoomInfo);

			if (data.oldRoomInfo.password !== '') {
				var oldRoomItems = getNode('.' + data.oldRoomInfo._id, true);
				oldRoomItems[0].removeChild(oldRoomItems[0].lastChild);
				oldRoomItems[1].removeChild(oldRoomItems[1].lastChild);
				var lockImg = document.createElement('img');
				lockImg.className = 'lock';
				lockImg.src = 'images/lock.png';
				lockImgs = [lockImg, lockImg.cloneNode()];
				oldRoomItems[0].appendChild(lockImgs[0]);
				oldRoomItems[1].appendChild(lockImgs[1]);
			} else {
				updatePeopleCounters(data.oldRoomInfo);
			}

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
				removeListItem(data.whoLeft._id);
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
		if (data.message) {
			toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000 });
		} else {
			elements.closeInputNameModal.dispatchEvent(new MouseEvent('click'));
		}

		if (data.user.status === 'doctor') {
			var roomItems = getNode('.roomsSidebar li + li', true);
			for(var i = 0; i < roomItems.length; ++i) {
				var subscribtionButton = document.createElement('img');
				subscribtionButton.src = '/images/subscribtion.png';
				subscribtionButton.className = 'subscribtionButton';
				roomItems[i].appendChild(subscribtionButton);
			}

			elements.subscribtionButtons = getNode('.subscribtionButton', true);
			for(var i = 0; i < elements.subscribtionButtons.length; ++i) {
				elements.subscribtionButtons[i].addEventListener('mouseenter', function(e) {
					if (this.src === '/images/subscribtion.png') {
						this.src = '/images/subscribe.png';
					} else {
						console.log('niko');
						this.src = '/images/subscribe.png';
					}
				});
				elements.subscribtionButtons[i].addEventListener('mouseleave', function(e) {
					if (this.src === '/images/subscribed.png') {
						this.src = '/images/subscribe.png';
					} else {
						this.src = '/images/subscribtion.png';
					}
				});

				elements.subscribtionButtons[i].addEventListener('click', function(e) {
					e.stopPropagation();

					var roomItemClass = this.parentNode.classList[1];
					var subscribtionButtons = getNode('.' + roomItemClass + ' .' + this.className, true);
					
					if (this.src === '/images/subscribe.png') {
						subscribtionButtons[0].src = '/images/subscribed.png';
						subscribtionButtons[1].src = '/images/subscribed.png';
						subscribtionButtons[0].classList.push('subscribed');
						subscribtionButtons[1].classList.push('subscribed');
					} else {
						subscribtionButtons[0].src = '/images/subscribtion.png';
						subscribtionButtons[1].src = '/images/subscribtion.png';
						subscribtionButtons[0].classList.remove('subscribed');
						subscribtionButtons[1].classList.remove('subscribed');
					}

					var roomName = this.parentNode.firstChild.textContent;
					socket.emit('subscribe', roomName);
				});
			}
		}

		elements.messageInput.addEventListener('keyup', function(e) {
			if (e.keyCode == 13) {
				socket.emit('message', { message: elements.messageInput.value });
				elements.messageInput.value = '';
			}
		});

		window.onunload = function() {
			socket.emit('left');
		};

		updatePeopleCounters(data.room);
		addListItem(elements.peopleLists, data.user);
	});

	socket.on('userIsTyping', function(userId) {
		var li = getNode('.' + userId, true);
		var img = document.createElement('img');
		img.src = 'images/pen.gif';
		img.style['margin-left'] = '10px';
		img.style.width = '20px';
		li[0].appendChild(img);
		li[1].appendChild(img.cloneNode());
	});

	socket.on('userStopTyping', function(userId) {
		var li = getNode('.' + userId, true);
		li[0].removeChild(li[0].lastChild);
		li[1].removeChild(li[1].lastChild);
	});

	socket.on('warning', function(data) {
		if (data.roomName) {
			elements.roomNameField.value = data.roomName;
		}
		if (data.identificationCode) {
			console.log('iden');
			elements.identificationCodeInput.value = '';
		}
		toastr.warning(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000 });
	});

	socket.on('message', function(message) {
		addMessage(elements.messageDiv, message);
	});

	socket.on('left', function(data) {

		updatePeopleCounters(data.room);

		removeListItem(data.user._id);
		toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000 });
	});

	elements.showInputNameModal.dispatchEvent(new MouseEvent('click'));
	elements.nameInput.focus();

	function joinedHandler(e) {
		if (e.keyCode == 13) {
			console.log('yes');
			socket.emit('joined', { userName: elements.nameInput.value, identificationCode: elements.identificationCodeInput.value });
		}
	}

	elements.nameInput.addEventListener('keyup', function (e) {
		joinedHandler(e);
	});
	elements.identificationCodeInput.addEventListener('keyup', function (e) {
		joinedHandler(e);
	});
};