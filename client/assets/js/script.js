window.onload = function() {

	var userId, userIdForPrivateConversation = null;

	function addListItem(lists, itemData, type) {
		var li = document.createElement('li');
		if (type === 'room') {
			li.className = itemData._id;
			if (itemData.name === 'global') {
				li.className += ' activeItem';
			}
			if (itemData.password !== '') {
				li.innerHTML = '<span>' + itemData.name + '</span><img class="lock" src="/images/lock.png" >';
			} else {
				li.innerHTML = '<span>' + itemData.name + '</span> <span>' + itemData.peopleCount + '</span>';
			}
		} else {
			if ('_' + socket.id === itemData._id) {
				li.className = itemData._id + ' meItem';
			} else if (itemData.status === 'doctor') {
				li.className = itemData._id + ' doctorItem';
			} else {
				li.className = itemData._id;
			}
			li.innerHTML = '<span>' + itemData.name + '</span>';
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
		if (data.isPrivate && data.self) {
			message.innerHTML = '<p>to: <span class="name">' + data.addresseeName + '</span><em class="date">' + data.date + '</em></p><p>' + data.text + '</p><hr>';
		} else if (data.isPrivate) {
			message.innerHTML = '<p>from: <span class="name">' + data.author + '</span><em class="date">' + data.date + '</em></p><p>' + data.text + '</p><hr>';
		} else {
			message.innerHTML = '<p><span class="name">' + data.author + '</span><em class="date">' + data.date + '</em></p><p>' + data.text + '</p><hr>';
		}

		messageDiv.appendChild(message);
	}

	function removeListItem(userId) {
		var nodeToDelete = getNode('.' + userId, true);
		nodeToDelete[0].parentNode.removeChild(nodeToDelete[0]);
		nodeToDelete[1].parentNode.removeChild(nodeToDelete[1]);
	}

	function changeRoomHandler() {
		if (this !== elements.activeItem[0] && this !== elements.activeItem[1]) {

			var roomItemClass = this.classList[0];
			var lockImgs = getNode('.roomsSidebar ul li.' + roomItemClass + ' .lock', true);

			if (!lockImgs[0]) {
				elements.activeItem[0].classList.remove('activeItem');
				elements.activeItem[1].classList.remove('activeItem');

				elements.activeItem = getNode('.' + this.className, true);
				elements.activeItem[0].classList.add('activeItem');
				elements.activeItem[1].classList.add('activeItem');
			}

			activeItemName = this.firstChild.textContent;

			socket.emit('changeRoom', { newRoom: activeItemName });
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
		var peopleCounters = getNode('.' + roomInfo._id + ' span:nth-child(2)', true);
		peopleCounters[0].innerHTML = roomInfo.peopleCount;
		peopleCounters[1].innerHTML = roomInfo.peopleCount;
	}

	function getElements() {
		var elements = {
			sendRoomCodeButton:       getNode('#sendRoomCode'),
			createRoomButton:         getNode('#createRoom'),
			sendPasswordButton:       getNode('#sendPassword'),
			joinButton:               getNode('#enterChat'),
			sendMessageButton:        getNode('#sendMessage'),
			privateConversationLink:  getNode('#privateConversationLink'),
			roomMessagesLink:         getNode("#roomMessagesLink"),
			privateMessagesLink:      getNode("#privateMessagesLink"),
			closePrivateMessageModal: getNode('#closePrivateMessageModal'),
			privateMessageDiv:        getNode('#privateMessages'),
			privateMessageTextarea:   getNode('#privateMessage'),
			sendPrivateMessageButton: getNode('#sendPrivateMessage'),
			openPrivateMessageModal:  getNode('#showPrivateMessageModal'),
			removeRoomModal:          getNode('#removeRoomModal'),
			showNewRoomModal:         getNode('.showNewRoomModal', true),
			showRemoveRoomModal:      getNode('.showRemoveRoomModal', true),
			closeRemoveRoomModal:     getNode('#closeRemoveRoomModal'),
			codeInput:                getNode('#code'),
			showRoomPasswordModal:    getNode('#showRoomPasswordModal'),
			closeRoomPasswordModal:   getNode('#closeRoomPasswordModal'),
			passwordInput:            getNode('#passwordInput'),
			roomNameField:            getNode('#roomName'),
			roomPasswordField:        getNode('#roomPassword'),
			roomPasswordRepeatField:  getNode('#roomPasswordRepeat'),
			roomCodeField:            getNode('#roomCode'),
			roomCodeRepeatField:      getNode('#roomCodeRepeat'),
			showInputNameModal:       getNode('#showInputNameModal'),
			closeInputNameModal:      getNode('#closeInputNameModal'),
			closeNewRoomModal:        getNode('#closeNewRoomModal'),
			messageInput:             getNode('.message-input input'),
			messageDiv:               getNode('#messages'),
			nameInput:                getNode('#name'),
			identificationCodeInput:  getNode('#identificationCode'),
			header:                   getNode('.header'),
			roomLists:                getNode('.roomsSidebar ul', true),
			peopleLists:              getNode('.peopleSidebar ul', true),
			peopleSidebar:            getNode('.peopleSidebar'),
			roomsSidebar:             getNode('.roomsSidebar'),
			roomsSidebarSmall:        getNode('.roomsSidebarSmall'),
			peopleSidebarSmall:       getNode('.peopleSidebarSmall'),
			roomsSidebarContent:      getNode('.roomsSidebar section'),
			peopleSidebarContent:     getNode('.peopleSidebar section'),
			roomsButton:              getNode('.header img:nth-child(1)'),
			peopleButton:             getNode('.header img:nth-child(2)'),
			roomsIcon:                getNode('.roomsIcon'),
			peopleIcon:               getNode('.peopleIcon')
		};
		return elements;
	}

	var elements = getElements();
	var activeItemName = 'global';

	elements.messageInput.addEventListener('focus', function() {
		socket.emit('userIsTyping', activeItemName);
	});

	elements.messageInput.addEventListener('blur', function() {
		socket.emit('userStopTyping', activeItemName);
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
			var personItems = addListItem(elements.peopleLists, people[i]);
			personItems[0].addEventListener('click', privateMessageHandler);
			personItems[1].addEventListener('click', privateMessageHandler);
		}

		elements.roomItems = getNode('.roomsSidebar ul li:not(.buttons)', true);
		for(i = 0; i < elements.roomItems.length; ++i) {
			elements.roomItems[i].addEventListener('click', changeRoomHandler);
		}

		// elements.peopleItems = getNode('.peopleSidebar ul li', true);
		// for(i = 0; i < elements.peopleItems.length; ++i) {
		// 	elements.peopleItems[i].addEventListener('click', privateMessageHandler);
		// }

		elements.activeItem = getNode('.activeItem', true);
	});

	function privateMessageHandler() {
		userId = this.className;
		elements.openPrivateMessageModal.dispatchEvent(new MouseEvent('click'));
		elements.privateMessageTextarea.focus();
		elements.privateMessageTextarea.select();
	}

	function sendPrivateMessage(e) {
		var whitespacePattern = /^\s*$/;

		if (whitespacePattern.test(elements.privateMessageTextarea.value)) {
			socket.emit('message', { isMessagePrivate: true, whoToSend: userId, message: elements.privateMessageTextarea.value });
		} else {
			elements.closePrivateMessageModal.dispatchEvent(new MouseEvent('click'));
			socket.emit('message', { isMessagePrivate: true, whoToSend: userId, message: elements.privateMessageTextarea.value });
		}
	}

	// ------------------ refactoring tasks -------------------- //

	// хешировать пароли
	// now chat print all messages from room and also private messages in "public messages block"
	// add close modal behavior on esc
	// private messages (margin)
	// fix date
	// add sound on notification
	// add tooltips on hover
	// put focus on message input when changing between room and private messages
	// remove outlines when pressing tab key to move between elements on page
	// change keyup -> keypress
	// chage img tags on background-image property
	// make cloner
	// exact names
	// findOne method
	// make len variable global
	// on esc close all opened modals
	// hide pen when somebody writes private message
	// watch all connections between users into the database (like who's having private conversation with who etc.)

	// -------------- future features -----------------

	// add file uploading
	// add avatars
	// add approvement button that message is red

	elements.privateMessageTextarea.addEventListener('keypress', function(e) {
		if (e.ctrlKey && e.keyCode == 13) {
			return;
		} else if (e.keyCode == 13) {
			sendPrivateMessage(e);
			e.preventDefault();
		}
	});

	elements.sendPrivateMessageButton.addEventListener('click', function(e) {
		sendPrivateMessage(e);
	});

	elements.passwordInput.addEventListener('keyup', function(e) {
		changeRoomFormSender(e);
	});

	function removeRoomFormSender(e) {
		if (e.keyCode == 13 || e.type === 'click') {
			socket.emit('removeRoom', { roomName: activeItemName, code: elements.codeInput.value });
			elements.codeInput.value = '';
		}
	}

	function changeRoomFormSender(e) {
		if (e.keyCode == 13 || e.type === 'click') {
			socket.emit('changeRoom', { newRoom: activeItemName, newRoomPassword: elements.passwordInput.value });
			elements.passwordInput.value = '';
		}
	}

	function newRoomFormSender(e) {

		if (e.keyCode == 13 || e.type === 'click') {
			socket.emit('createRoom', { roomName: elements.roomNameField.value, roomPassword: elements.roomPasswordField.value, roomPasswordRepeat: elements.roomPasswordRepeatField.value, roomCode: elements.roomCodeField.value, roomCodeRepeat: elements.roomCodeRepeatField.value });
		}
	}

	function cleanNewRoomForm() {
		elements.roomPasswordField.value = '';
		elements.roomPasswordRepeatField.value = '';
		elements.roomCodeField.value = '';
		elements.roomCodeRepeatField.value = '';
	}

	elements.showNewRoomModal[0].addEventListener('click', function() {
		cleanNewRoomForm();
		elements.roomNameField.focus();
		elements.roomNameField.select();
	});

	elements.showNewRoomModal[1].addEventListener('click', function() {
		cleanNewRoomForm();
		elements.roomNameField.focus();
		elements.roomNameField.select();
	});

	elements.showRemoveRoomModal[0].addEventListener('click', function() {

		elements.codeInput.value = '';

		if (elements.pTag) {
			elements.codeInput.parentNode.removeChild(elements.pTag);
			elements.pTag = undefined;
		}
		socket.emit('removeRoom', activeItemName);
		elements.codeInput.focus();
	});

	elements.showRemoveRoomModal[1].addEventListener('click', function() {

		elements.codeInput.value = '';

		if (elements.pTag) {
			elements.codeInput.parentNode.removeChild(elements.pTag);
			elements.pTag = undefined;
		}
		socket.emit('removeRoom', activeItemName);
		elements.codeInput.focus();
	});

	elements.roomNameField.addEventListener('keyup', function(e) {
		newRoomFormSender(e);
	});

	elements.roomPasswordField.addEventListener('keyup', function(e) {
		newRoomFormSender(e);
	});

	elements.roomPasswordRepeatField.addEventListener('keyup', function(e) {
		newRoomFormSender(e);
	});

	elements.roomCodeField.addEventListener('keyup', function(e) {
		newRoomFormSender(e);
	});

	elements.roomCodeRepeatField.addEventListener('keyup', function(e) {
		newRoomFormSender(e);
	});

	elements.codeInput.addEventListener('keyup', function(e) {
		removeRoomFormSender(e);
	});

	socket.on('removeRoom', function(data) {
		if (data.peopleCount && data.peopleCount !== 0) {
			var pTag = document.createElement('p');
			pTag.innerHTML = 'There\'re <strong>' + data.peopleCount + '</strong> men at this room. When room gets removed all people will be moved to "global" room';
			elements.codeInput.parentNode.insertBefore(pTag, elements.codeInput);
			elements.pTag = pTag;
		} else {

			if (data.globalRoomInfo) {
				updatePeopleCounters(data.globalRoomInfo);
			} else {
				toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });

				if (data.self) {
					elements.closeRemoveRoomModal.dispatchEvent(new MouseEvent('click'));
				}

				if (data.roomId) {
					var removedRoomItems = getNode('.' + data.roomId, true);
					removedRoomItems[0].parentNode.removeChild(removedRoomItems[0]);
					removedRoomItems[1].parentNode.removeChild(removedRoomItems[1]);
				}

				if (data.user) {

					var i;
					elements.activeItem = getNode('.roomsSidebar ul li:first-child', true);
					elements.activeItem[0].classList.add('activeItem');
					elements.activeItem[1].classList.add('activeItem');

					elements.peopleLists[0].innerHTML = '';
					elements.peopleLists[1].innerHTML = '';
					elements.messageDiv.innerHTML = '';

					var len;

					if (data.peopleFromGlobalRoom.length !== 0) {
						len = data.peopleFromGlobalRoom.length;
						for(i = 0; i < len; ++i) {
							personItems = addListItem(elements.peopleLists, data.peopleFromGlobalRoom[i]);
							personItems[0].addEventListener('click', privateMessageHandler);
							personItems[1].addEventListener('click', privateMessageHandler);
						}
					}

					if (data.peopleFromRemovedRoom.length !== 0) {
						len = data.peopleFromRemovedRoom.length;
						for(i = 0; i < len; ++i) {
							if ('_' + socket.id !== data.peopleFromRemovedRoom[i]._id) {
								personItems = addListItem(elements.peopleLists, data.peopleFromRemovedRoom[i]);
								personItems[0].addEventListener('click', privateMessageHandler);
								personItems[1].addEventListener('click', privateMessageHandler);
							}
						}
					}

					if (data.messages.length !== 0) {
						for(i = 0; i < data.messages.length; ++i) {
							addMessage(elements.messageDiv, data.messages[i]);
						}
					}

					addListItem(elements.peopleLists, data.user);
				}
			}
		}
	});

	socket.on('transferPeopleFromRemovedRoom', function (peopleFromRemovedRoom) {
		var len = peopleFromRemovedRoom.length;
		for(var i = 0; i < len; ++i) {
			personItems = addListItem(elements.peopleLists, peopleFromRemovedRoom[i]);
			personItems[0].addEventListener('click', privateMessageHandler);
			personItems[1].addEventListener('click', privateMessageHandler);
		}
	});

	socket.on('createRoom', function(data) {
		if (data.message) {
			toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
		} else {
			elements.closeNewRoomModal.dispatchEvent(new MouseEvent('click'));
		}
		var newRoomItem = addListItem(elements.roomLists, data.room, 'room');

		newRoomItem[0].addEventListener('click', changeRoomHandler);
		newRoomItem[1].addEventListener('click', changeRoomHandler);

		if (socket.status === 'doctor') {
			var subscribtionButton = document.createElement('img');
			subscribtionButton.className = 'subscribtionButton';
			subscribtionButton.src = '/images/subscribtion.png';

			var subscribtionButtons = [ subscribtionButton, subscribtionButton.cloneNode(true) ];

			newRoomItem[0].appendChild(subscribtionButtons[0]);
			newRoomItem[1].appendChild(subscribtionButtons[1]);


			for(var i = 0; i < subscribtionButtons.length; ++i) {
				subscribtionButtons[i].addEventListener('mouseenter', function(e) {
						if (this.classList.contains('subscribed')) {
							this.src = '/images/unsubscribe.png';
						} else {
							this.src = '/images/subscribe.png';
						}
				});
				subscribtionButtons[i].addEventListener('mouseleave', function(e) {
					if (this.classList.contains('subscribed')) {
						this.src = '/images/subscribed.png';
					} else {
						this.src = '/images/subscribtion.png';
					}
				});

				subscribtionButtons[i].addEventListener('click', function(e) {
					e.stopPropagation();

					var roomItemClass = this.parentNode.classList[0];
					var subscribtionButtons = getNode('.' + roomItemClass + ' .subscribtionButton', true);
					if (!this.classList.contains('subscribed')) {
						subscribtionButtons[0].src = '/images/subscribed.png';
						subscribtionButtons[1].src = '/images/subscribed.png';
						subscribtionButtons[0].className += ' subscribed';
						subscribtionButtons[1].className += ' subscribed';
					} else {
						subscribtionButtons[0].src = '/images/subscribtion.png';
						subscribtionButtons[1].src = '/images/subscribtion.png';
						subscribtionButtons[0].className = 'subscribtionButton';
						subscribtionButtons[1].className = 'subscribtionButton';
					}

					var roomName = this.parentNode.firstChild.textContent;
					socket.emit('subscribe', roomName);
				});
			}
		}
	});

	socket.on('openRoomPasswordModal', function() {
		elements.passwordInput.value = '';
		elements.showRoomPasswordModal.dispatchEvent(new MouseEvent('click'));
		elements.passwordInput.focus();
	});

	elements.passwordInput.addEventListener('click', function(e) {
		if (e.keyCode == 13) {
			socket.emit('changeRoom', { password: this.value });
		}
	});

	socket.on('changeRoom', function(data) {
		var personItems;
		if (data.forAllClients) {
			if (data.oldRoomInfo.password === '' || activeItemName === data.oldRoomInfo.name) {
				updatePeopleCounters(data.oldRoomInfo);
			}
			if (data.newRoomInfo.password === '' || activeItemName === data.newRoomInfo.name) {
				updatePeopleCounters(data.newRoomInfo);
			}
		} else if (data.people) {
			var lockImgs;
			if (data.isRoomPrivate) {
				elements.closeRoomPasswordModal.dispatchEvent(new MouseEvent('click'));
			}
			if (data.newRoomInfo.password !== '') {

				elements.activeItem[0].classList.remove('activeItem');
				elements.activeItem[1].classList.remove('activeItem');

				elements.activeItem = getNode('.' + data.newRoomInfo._id, true);
				elements.activeItem[0].classList.add('activeItem');
				elements.activeItem[1].classList.add('activeItem');

				lockImgs = getNode('.' + data.newRoomInfo._id + ' .lock', true);
				var newRoomItems = [lockImgs[0].parentNode, lockImgs[1].parentNode];
				newRoomItems[0].removeChild(lockImgs[0]);
				newRoomItems[1].removeChild(lockImgs[1]);

				if (socket.status === 'doctor') {
					newRoomItems[0].insertBefore(document.createElement('span'), newRoomItems[0].lastChild);
					newRoomItems[1].insertBefore(document.createElement('span'), newRoomItems[1].lastChild);

				} else {
					newRoomItems[0].appendChild(document.createElement('span'));
					newRoomItems[1].appendChild(document.createElement('span'));
				}
			}
			updatePeopleCounters(data.newRoomInfo);

			if (data.oldRoomInfo.password !== '') {
				var oldRoomItems = getNode('.' + data.oldRoomInfo._id, true);
				var lockImg = document.createElement('img');
				lockImg.className = 'lock';
				lockImg.src = 'images/lock.png';
				lockImgs = [lockImg, lockImg.cloneNode()];
				if (socket.status === 'doctor') {
					var peopleCounters = getNode('.' + data.oldRoomInfo._id + ' span:nth-child(2)', true);
					var subscribtionButtons = getNode('.' + data.oldRoomInfo._id + ' .subscribtionButton', true);
					oldRoomItems[0].removeChild(peopleCounters[0]);
					oldRoomItems[1].removeChild(peopleCounters[1]);
					oldRoomItems[0].insertBefore(lockImgs[0], subscribtionButtons[0]);
					oldRoomItems[1].insertBefore(lockImgs[1], subscribtionButtons[1]);
				} else {
					oldRoomItems[0].removeChild(oldRoomItems[0].lastChild);
					oldRoomItems[1].removeChild(oldRoomItems[1].lastChild);
					oldRoomItems[0].appendChild(lockImgs[0]);
					oldRoomItems[1].appendChild(lockImgs[1]);
				}
			} else {
				updatePeopleCounters(data.oldRoomInfo);
			}

			var i;
			elements.peopleLists[0].innerHTML = '';
			elements.peopleLists[1].innerHTML = '';
			elements.messageDiv.innerHTML = '';
			if (data.people.length !== 0) {
				for(i = 0; i < data.people.length; ++i) {
					personItems = addListItem(elements.peopleLists, data.people[i]);
					personItems[0].addEventListener('click', privateMessageHandler);
					personItems[1].addEventListener('click', privateMessageHandler);
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
				personItems = addListItem(elements.peopleLists, data.user);
				personItems[0].addEventListener('click', privateMessageHandler);
				personItems[1].addEventListener('click', privateMessageHandler);
			}
			toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
		}
	});

	window.addEventListener('resize', function() {
		transformSidebarsForSmallScreenSizes();
	});

	elements.header.addEventListener('click', panelHandler);
	elements.messageDiv.addEventListener('click', panelHandler);
	elements.privateMessageDiv.addEventListener('click', panelHandler);
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
			toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });

			var personItems = addListItem(elements.peopleLists, data.user);
			personItems[0].addEventListener('click', privateMessageHandler);
			personItems[1].addEventListener('click', privateMessageHandler);
		} else if (data.status) {

			if (data.status === 'doctor') {
				socket.status = 'doctor';
				var roomItems = getNode('.roomsSidebar li + li', true);
				for(var i = 0; i < roomItems.length; ++i) {
					var subscribtionButton = document.createElement('img');
					subscribtionButton.src = '/images/subscribtion.png';
					subscribtionButton.className = 'subscribtionButton';
					roomItems[i].appendChild(subscribtionButton);
				}

				var subscribtionButtons = getNode('.subscribtionButton', true);

				var len = subscribtionButtons.length;

				for(var i = 0; i < len; ++i) {
					subscribtionButtons[i].addEventListener('mouseenter', function(e) {
						if (this.classList.contains('subscribed')) {
							this.src = '/images/unsubscribe.png';
						} else {
							this.src = '/images/subscribe.png';
						}
					});
					subscribtionButtons[i].addEventListener('mouseleave', function(e) {
						if (this.classList.contains('subscribed')) {
							this.src = '/images/subscribed.png';
						} else {
							this.src = '/images/subscribtion.png';
						}
					});

					subscribtionButtons[i].addEventListener('click', function(e) {
						e.stopPropagation();

						var roomItemClass = this.parentNode.classList[0];
						var subscribtionButtons = getNode('.' + roomItemClass + ' .subscribtionButton', true);
						var roomName = this.parentNode.firstChild.textContent;
						if (!this.classList.contains('subscribed')) {
							subscribtionButtons[0].src = '/images/subscribed.png';
							subscribtionButtons[1].src = '/images/subscribed.png';
							subscribtionButtons[0].className += ' subscribed';
							subscribtionButtons[1].className += ' subscribed';
							socket.emit('subscribe', roomName);
						} else {
							subscribtionButtons[0].src = '/images/subscribtion.png';
							subscribtionButtons[1].src = '/images/subscribtion.png';
							subscribtionButtons[0].className = 'subscribtionButton';
							subscribtionButtons[1].className = 'subscribtionButton';
							socket.emit('unsubscribe', roomName);
						}
					});
				}
			}

			elements.closeInputNameModal.dispatchEvent(new MouseEvent('click'));
			addListItem(elements.peopleLists, data.user);
			window.onunload = function() {
				socket.emit('left');
			};
		} else if (data.room) {
			updatePeopleCounters(data.room);
		}
	});

	function sendMessage() {
		if (userIdForPrivateConversation !== null) {
			socket.emit('message', { isMessagePrivate: true, whoToSend: userIdForPrivateConversation, message: elements.messageInput.value });
		} else {
			socket.emit('message', { message: elements.messageInput.value });
		}
		elements.messageInput.value = '';
	}

	elements.sendMessageButton.addEventListener('click', function(e) {
		sendMessage();
	});

	elements.messageInput.addEventListener('keyup', function(e) {
		if (e.keyCode == 13) {
			sendMessage();
		}
	});

	socket.on('notifySubscriber', function (info) {
		toastr.success(info, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 0, preventDuplicates: true, closeHtml: '<button>hello</button>' });
	});

	socket.on('userIsTyping', function(userId) {
		var li = getNode('.' + userId, true);
		var img = document.createElement('img');
		img.src = 'images/pen.gif';
		img.className = 'userIsTypingIcon';
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
			elements.identificationCodeInput.value = '';
		}
		toastr.warning(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
	});

	elements.roomMessagesLink.addEventListener('click', function(e) {
		elements.messageDiv.style.display = 'block';
		elements.roomMessagesLink.classList.remove('unactiveMessagesLink');

		elements.privateMessageDiv.style.display = 'none';
		elements.privateMessagesLink.classList.add('unactiveMessagesLink');
	});

	elements.privateMessagesLink.addEventListener('click', function(e) {
		elements.messageDiv.style.display = 'none';
		elements.roomMessagesLink.classList.add('unactiveMessagesLink');

		elements.privateMessageDiv.style.display = 'block';
		elements.privateMessagesLink.classList.remove('unactiveMessagesLink');
	});

	socket.on('message', function(data) {
		if (data.isPrivate) {
			if (data.sender) {
				toastr.success(data.sender + ' send you private message: "' + data.message.text + '".', null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
				addMessage(elements.privateMessageDiv, data.message);
			} else {

				if (userIdForPrivateConversation && elements.privateMessageDiv.style.display === ''
					|| elements.privateMessageDiv.style.display === 'none') {
					elements.messageDiv.style.display = 'none';
					elements.roomMessagesLink.classList.add('unactiveMessagesLink');

					elements.privateMessageDiv.style.display = 'block';
					elements.privateMessagesLink.classList.remove('unactiveMessagesLink');
				}

				addMessage(elements.privateMessageDiv, data.message);
				elements.privateMessageDiv.scrollTop = elements.privateMessageDiv.scrollHeight;
			}
		} else {

			if (data.self) {
				if (elements.privateMessageDiv.style.display === 'block') {

					elements.messageDiv.style.display = 'block';
					elements.roomMessagesLink.classList.remove('unactiveMessagesLink');

					elements.privateMessageDiv.style.display = 'none';
					elements.privateMessagesLink.classList.add('unactiveMessagesLink');
				}
			}

			addMessage(elements.messageDiv, data.message);
			elements.messageDiv.scrollTop = elements.messageDiv.scrollHeight;
		}
	});

	socket.on('disablePrivateConversation', function (message) {
		toastr.success(message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
	});

	function privateConversationHandler(e, cancelPrivateConversation) {

		var privateConversationIcons = getNode('.privateConversation', true);

		if (privateConversationIcons.length !== 0) {
			removePrivateConversationIcons(privateConversationIcons);
			// var oldUserItems = [privateConversationIcons[0].parentNode, privateConversationIcons[1].parentNode];
			// oldUserItems[0].removeChild(privateConversationIcons[0]);
			// oldUserItems[1].removeChild(privateConversationIcons[1]);
			// oldUserItems[0].classList.remove('activeItem');
			// oldUserItems[1].classList.remove('activeItem');
			// oldUserItems[0].addEventListener('click', privateMessageHandler);
			// oldUserItems[1].addEventListener('click', privateMessageHandler);

		}

		if (cancelPrivateConversation) {
			socket.emit('disablePrivateConversation', userIdForPrivateConversation);
			userIdForPrivateConversation = null;
			elements.messageInput.placeholder = 'Message';
			return;
		}

		var userItems = getNode('.' + userIdForPrivateConversation, true);
		// userItems[0].classList.add('activeItem');
		// userItems[1].classList.add('activeItem');

		userItems[0].removeEventListener('click', privateMessageHandler);
		userItems[1].removeEventListener('click', privateMessageHandler);

		var cancelPrivateConversationIcon = document.createElement('img');
		cancelPrivateConversationIcon.src = '/images/privateConversationIcon.png';
		cancelPrivateConversationIcon.className = 'privateConversation';

		cancelPrivateConversationIcon.addEventListener('mouseenter', function(e) {
			this.src = '/images/cancelPrivateConversationIcon.png';
		});

		cancelPrivateConversationIcon.addEventListener('mouseleave', function(e) {
			this.src = '/images/privateConversationIcon.png';
		});

		cancelPrivateConversationIcon.addEventListener('click', function(e) {
			e.stopPropagation();
			privateConversationHandler(e, true);
		});

		userItems[0].appendChild(cancelPrivateConversationIcon);

		var cancelPrivateConversationIconClone = cancelPrivateConversationIcon.cloneNode(true);

		cancelPrivateConversationIconClone.addEventListener('mouseenter', function(e) {
			this.src = '/images/cancelPrivateConversationIcon.png';
		});

		cancelPrivateConversationIconClone.addEventListener('mouseleave', function(e) {
			this.src = '/images/privateConversationIcon.png';
		});

		cancelPrivateConversationIconClone.addEventListener('click', function(e) {
			e.stopPropagation();
			privateConversationHandler(e, true);
		});

		userItems[1].appendChild(cancelPrivateConversationIconClone);

		elements.closePrivateMessageModal.dispatchEvent(new MouseEvent('click'));
	}

	elements.privateConversationLink.addEventListener('click', function(e) {
		socket.emit('establishPrivateConversation', userId);
		userIdForPrivateConversation = userId;
		socket.emit('getUserName', userIdForPrivateConversation);
		privateConversationHandler(e);
	});

	socket.on('establishPrivateConversation', function(message) {
		toastr.success(message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
	});

	socket.on('getUserName', function(userName) {
		elements.messageInput.placeholder = 'Private message to ' + userName;
	});

	function removePrivateConversationIcons(privateConversationIcons) {
		var oldUserItems = [privateConversationIcons[0].parentNode, privateConversationIcons[1].parentNode];
		oldUserItems[0].removeChild(privateConversationIcons[0]);
		oldUserItems[1].removeChild(privateConversationIcons[1]);
		oldUserItems[0].addEventListener('click', privateMessageHandler);
		oldUserItems[1].addEventListener('click', privateMessageHandler);
	}

	socket.on('left', function(data) {

		if (data.room) {
			updatePeopleCounters(data.room);
		} else {
			if (data.user._id === userIdForPrivateConversation) {
				removePrivateConversationIcons(getNode('.privateConversation', true));
				userIdForPrivateConversation = null;
				elements.messageInput.placeholder = 'Message';
			}

			removeListItem(data.user._id);
			toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
		}
	});

	socket.on('disconnect', function() {
		location.reload();
	});

	elements.showInputNameModal.dispatchEvent(new MouseEvent('click'));
	elements.nameInput.focus();

	function joinedHandler(e) {
		if (e.type === 'click' || e.keyCode == 13) {
			socket.emit('joined', { userName: elements.nameInput.value, identificationCode: elements.identificationCodeInput.value });
		}
	}

	elements.sendRoomCodeButton.addEventListener('click', function (e) {
		removeRoomFormSender(e);
	});

	elements.createRoomButton.addEventListener('click', function (e) {
		newRoomFormSender(e);
	});

	elements.sendPasswordButton.addEventListener('click', function (e) {
		changeRoomFormSender(e);
	});

	elements.joinButton.addEventListener('click', function(e) {
		joinedHandler(e);
	});

	elements.nameInput.addEventListener('keyup', function (e) {
		joinedHandler(e);
	});

	elements.identificationCodeInput.addEventListener('keyup', function (e) {
		joinedHandler(e);
	});
};