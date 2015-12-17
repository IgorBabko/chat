;$(function () {

    var socket = io();
    $("time").timeago();

    $("#enter-chat-modal").modal({backdrop: 'static', keyboard: false});


    var gridManager = {

        isRoomsVisible: true,
        isPeopleVisible: true,
        contentMarginLeft: 300,
        contentMarginRight: 300,
        isOverlayShown: false,
        isScreenWide: true,
        contentWidthCrop: 600,

        init: function () {
            this.defineInitialGrid();
            this.setupHandlers();
            $("html").show();
            return this;
        },
        defineInitialGrid: function () {
            if ($(window).width() > 992) {
                $(".content").css({
                    "width": "calc(100% - " + this.contentWidthCrop + "px)",
                    "margin": "0 " + this.contentMarginRight + "px 0 " + this.contentMarginLeft + "px"
                });
            } else {
                this.isRoomsVisible = false;
                this.isPeopleVisible = false;
                this.contentMarginLeft = 0;
                this.contentMarginRight = 0;
                this.isScreenWide = false;
                this.contentWidthCrop = 600;
                $("#rooms-sidebar-button, #people-sidebar-button").removeClass("active");
                $("#rooms-sidebar, #people-sidebar").addClass("hidden");
                $("#rooms-sidebar ul, #people-sidebar ul").addClass("shadowless");
                $(".content").css({"width": "100%", "margin": "0"});
            }
        },
        setupHandlers: function () {
            $("#rooms-sidebar-button, #people-sidebar-button").on("click", this.togglingSidebarsHandler);
            $(window).on("resize", this.resizingWindowHandler);
            $(".content").on("click", this.clickOverlayHandler);
        },
        togglingSidebarsHandler: function () {
            var $this = $(this);
            var _this = gridManager;
            $this.toggleClass("active");
            if ($this.attr("id") === "rooms-sidebar-button") {
                $("#rooms-sidebar").toggleClass("hidden");
                _this.isRoomsVisible = !_this.isRoomsVisible;
            } else {
                $("#people-sidebar").toggleClass("hidden");
                _this.isPeopleVisible = !_this.isPeopleVisible;
            }

            if ($(window).width() > 992) {
                _this.contentWidthCrop = _this.isRoomsVisible && _this.isPeopleVisible ? 600 : _this.isRoomsVisible || _this.isPeopleVisible ? 300 : 0;
                _this.contentMarginLeft = _this.isRoomsVisible ? 300 : 0;
                _this.contentMarginRight = _this.isPeopleVisible ? 300 : 0;
                $(".content").css({
                    "width": "calc(100% - " + _this.contentWidthCrop + "px)",
                    "margin": "0 " + _this.contentMarginRight + "px 0 " + _this.contentMarginLeft + "px"
                });
            } else {
                _this.toggleOverlay();
                $(".content").css({"width": "100%", "margin": "0"});
            }
        },
        resizingWindowHandler: function () {
            var _this = gridManager;
            if ($(window).width() > 992 && !_this.isScreenWide) {
                $("#rooms-sidebar ul, #people-sidebar ul").removeClass("shadowless");
                _this.isScreenWide = true;
                _this.contentWidthCrop = _this.isRoomsVisible && _this.isPeopleVisible ? 600 : _this.isRoomsVisible || _this.isPeopleVisible ? 300 : 0;
                _this.contentMarginLeft = _this.isRoomsVisible ? 300 : 0;
                _this.contentMarginRight = _this.isPeopleVisible ? 300 : 0;
                $(".content").removeClass("shadowed").css({
                    "width": "calc(100% - " + _this.contentWidthCrop + "px)",
                    "margin": "0 " + _this.contentMarginRight + "px 0 " + _this.contentMarginLeft + "px"
                });
            } else if ($(window).width() <= 992 && _this.isScreenWide) {
                $("#rooms-sidebar ul, #people-sidebar ul").addClass("shadowless");
                _this.isScreenWide = false;
                _this.toggleOverlay();
                $(".content").css({"width": "100%", "margin": "0"});
            }
        },
        clickOverlayHandler: function () {
            if ($(window).width() <= 992) {
                var _this = gridManager;
                if (_this.isOverlayShown) {
                    $("#rooms-sidebar-button, #people-sidebar-button").removeClass("active");
                    $("#rooms-sidebar, #people-sidebar").addClass("hidden");
                    $(".content").removeClass("shadowed");
                    _this.isRoomsVisible = false;
                    _this.isPeopleVisible = false;
                    _this.isOverlayShown = false;
                }
            }
        },
        toggleOverlay: function () {
            var _this = gridManager;
            if (_this.isRoomsVisible || _this.isPeopleVisible) {
                $(".content").addClass("shadowed");
                _this.isOverlayShown = true;
            } else {
                $(".content").removeClass("shadowed");
                _this.isOverlayShown = false;
            }
        }
    };

    gridManager.init();

    $("#create-room-button").on("click", function () {
        $("#create-room-modal").modal().on("shown.bs.modal", function () {
            $("#room-name-input").focus();
        });
    });

    $("#delete-room-button").on("click", function () {
        $("#delete-room-modal").modal().on("shown.bs.modal", function () {
            $("#room-c-input").focus();
        });
    });

    $("#people-sidebar li").on("click", function () {
        $("#private-message-modal").modal().on("shown.bs.modal", function () {
            $("#private-message-textarea").focus();
        });
    });

    $("#rooms-sidebar li").on("click", function () {
        $("#room-password-modal").modal().on("shown.bs.modal", function () {
            $("#room-pass-input").focus();
        });
    });

    $("#private-messages-button").on("click", function () {
        $("#private-messages").show();
        $("#public-messages").hide();
    });

    $("#public-messages-button").on("click", function () {
        $("#public-messages").show();
        $("#private-messages").hide();
    });

    var whitespacePattern = /^\s*$/;

    $("#send-message-button").on("click", function () {
        socket.emit("message", $("#message-input").val());
    });

    // keypress handler

    var messageTemplate = window.Handlebars.compile($("#message-template").html());
    var roomTemplate = window.Handlebars.compile($("#room-template").html());

    socket.on("message", function (data) {
        $("#public-messages").append(messageTemplate(data)).find("time:last-child").timeago();
    });

    // join
    function joinedHandler(e) {
        if (e.type === 'click' || e.keyCode == 13) {
            socket.emit('joined', $("#username-input").val());
        }
    }

    socket.on("joined", function (data) {
        $("#enter-chat-modal").modal("hide");
    });


    // warning
    socket.on("warning", function (message) {
        console.log(data);
    });

    $("#enter-chat-button").on('click', function (e) {
        joinedHandler(e);
    });
    $("#username-input").on('keypress', function (e) {
        joinedHandler(e);
    });

    // create room

    function hideValidationErrors(modalId) {
        $("#" + modalId + " .has-danger")
            .removeClass("has-danger")
            .find("input")
            .removeClass("form-control-danger")
            .end()
            .find(".invalid")
            .text("");
    }

    function showValidationErrors(errors) {
        for (var fieldName in errors) {
            $("#" + fieldName)
                .siblings(".invalid")
                .text(errors[fieldName])
                .end()
                .addClass("form-control-danger")
                .parent()
                .addClass("has-danger");
        }
    }

    $("#create").on("click", function (e) {
        e.preventDefault();

        hideValidationErrors("create-room-modal");

        var roomInfo = {};

        console.log("create");

        roomInfo["room-name"] = $("#room-name").val();
        roomInfo["room-password"] = $("#room-password").val();
        roomInfo["room-password-confirm"] = $("#room-password-confirm").val();
        roomInfo["room-code"] = $("#room-code").val();
        roomInfo["room-code-confirm"] = $("#room-code-confirm").val();

        socket.emit("createRoom", roomInfo);
    });

    socket.on("createRoom", function (roomInfo) {
        if (roomInfo) {
            $("#rooms-sidebar ul").prepend(roomTemplate(roomInfo));
        } else {
            $("#create-room-modal").modal("hide");
        }
    });

    socket.on("validErrors", function (errors) {
        showValidationErrors(errors);
    });


});


//var oldUserName = '';
//var renameUserItem = null;
//
//var warningSound = new Audio('/sounds/warning-sound.mp3');
//var infoSound = new Audio('/sounds/info-sound.mp3');
//var messageSound = new Audio('/sounds/message-sound.mp3');
//
//var userId, userIdForPrivateConversation = null;
//
//var isPrivateMessageModalOpened = false, isRoomPasswordModalOpened = false,
//    isNewRoomModalOpened = false, isRemoveRoomModalOpened = false;
//
//var isPrivateMessagesBlockOpened = false;
//
//function notification(message, type, timeOut) {
//    timeOut = (timeOut !== undefined) ? timeOut : 3000;
//    if (!type || type === 'info') {
//        infoSound.play();
//        toastr.success(message, null, {
//            closeButton: true,
//            positionClass: 'toast-bottom-right',
//            timeOut: timeOut,
//            preventDuplicates: true
//        });
//    } else if (type === 'warning') {
//        warningSound.play();
//        toastr.warning(message, null, {
//            closeButton: true,
//            positionClass: 'toast-bottom-right',
//            timeOut: timeOut,
//            preventDuplicates: true
//        });
//    }
//}
//
//function assignRenameHandlers(currentUserItems) {
//    currentUserItems[0].addEventListener('click', function (e) {
//        e.stopPropagation();
//        if (!renameUserItem) {
//            renameHandler(this);
//        }
//    });
//    currentUserItems[1].addEventListener('click', function (e) {
//        e.stopPropagation();
//        if (!renameUserItem) {
//            renameHandler(this);
//        }
//    });
//}
//
//function addListItem(lists, itemData, type) {
//    var li = document.createElement('li');
//    if (type === 'room') {
//        li.className = itemData._id;
//        if (itemData.name === 'global') {
//            li.className += ' activeItem';
//        }
//        if (itemData.password !== '') {
//            li.innerHTML = '<span>' + itemData.name + '</span><img class="lock" src="/images/lock.png" >';
//        } else {
//            li.innerHTML = '<span>' + itemData.name + '</span> <span>' + itemData.peopleCount + '</span>';
//        }
//    } else {
//        if ('_' + socket.id === itemData._id) {
//            li.className = itemData._id + ' meItem';
//        } else if (itemData.status === 'doctor') {
//            li.className = itemData._id + ' doctorItem';
//        } else {
//            li.className = itemData._id;
//        }
//        li.innerHTML = '<span>' + itemData.name + '</span>';
//    }
//    var li2 = li.cloneNode(true);
//    if (lists[0].firstChild !== null && type !== 'room') {
//        lists[0].insertBefore(li, lists[0].firstChild);
//        lists[1].insertBefore(li2, lists[1].firstChild);
//    } else {
//        lists[0].appendChild(li);
//        lists[1].appendChild(li2);
//    }
//
//    return [li, li2];
//}

//
//function addMessage(messageDiv, data) {
//    var message = document.createElement('div');
//
//    var messageDate = new Date(data.date);
//    var timezoneOffsetInHours = new Date().getTimezoneOffset() / 60;
//
//
//    var dateString = messageDate.getDate();
//    var currentMonth = messageDate.getMonth() + 1;
//    if (('' + currentMonth).length === 1) {
//        currentMonth = '0' + currentMonth;
//    }
//    dateString += '.' + currentMonth;
//    dateString += '.' + (messageDate.getYear() - 100);
//    dateString += '  ' + (messageDate.getHours() - timezoneOffsetInHours);
//    dateString += ':' + messageDate.getMinutes();
//
//    if (data.isPrivate && data.self) {
//        message.innerHTML = '<p>to: <span class="name">' + data.addresseeName + '</span><em class="date">' + dateString + '</em></p><p class="messageText">' + data.text + '</p><hr>';
//    } else if (data.isPrivate) {
//        message.innerHTML = '<p>from: <span class="name">' + data.author + '</span><em class="date">' + dateString + '</em></p><p class="messageText">' + data.text + '</p><hr>';
//    } else {
//        message.innerHTML = '<p><span class="name">' + data.author + '</span><em class="date">' + dateString + '</em></p><p class="messageText">' + data.text + '</p><hr>';
//    }
//
//    messageDiv.appendChild(message);
//}
//
//function removeListItem(userId) {
//    var nodeToDelete = getNode('.' + userId, true);
//    nodeToDelete[0].parentNode.removeChild(nodeToDelete[0]);
//    nodeToDelete[1].parentNode.removeChild(nodeToDelete[1]);
//}
//
//function changeRoomHandler() {
//    if (this !== elements.activeItem[0] && this !== elements.activeItem[1]) {
//
//        var roomItemClass = this.classList[0];
//        var lockImgs = getNode('.roomsSidebar ul li.' + roomItemClass + ' .lock', true);
//
//        if (!lockImgs[0]) {
//            elements.activeItem[0].classList.remove('activeItem');
//            elements.activeItem[1].classList.remove('activeItem');
//
//            elements.activeItem = getNode('.' + this.className, true);
//            elements.activeItem[0].classList.add('activeItem');
//            elements.activeItem[1].classList.add('activeItem');
//        }
//
//        activeItemName = this.firstChild.textContent;
//
//        socket.emit('changeRoom', {newRoom: activeItemName});
//    }
//}
//
//function transformSidebarsForSmallScreenSizes() {
//    if (window.outerWidth <= 799 && isScreenLarge) {
//        isScreenLarge = false;
//    }
//    if (window.outerWidth > 799 && !isScreenLarge) {
//        isScreenLarge = true;
//        panelHandler();
//    }
//}


//
//function panelHandler() {
//    if (roomsOpened) {
//        elements.roomsButton.click();//dispatchEvent(new MouseEvent('click'));
//    }
//    if (peopleOpened) {
//        elements.peopleButton.click();//dispatchEvent(new MouseEvent('click'));
//    }
//}
//
//function updatePeopleCounters(roomInfo) {
//    var peopleCounters = getNode('.' + roomInfo._id + ' span:nth-child(2)', true);
//    peopleCounters[0].innerHTML = roomInfo.peopleCount;
//    peopleCounters[1].innerHTML = roomInfo.peopleCount;
//}

/*function getElements() {
 var elements = {
 closeRoomsSidebarSmallButton: getNode('#closeRoomsSidebarSmallButton'),
 closePeopleSidebarSmallButton: getNode('#closePeopleSidebarSmallButton'),
 sendRoomCodeButton: getNode('#sendRoomCode'),
 createRoomButton: getNode('#createRoom'),
 sendPasswordButton: getNode('#sendPassword'),
 $enterChatButton: $(getNode('#enter')),
 sendMessageButton: getNode('#sendMessage'),
 privateConversationLink: getNode('#privateConversationLink'),
 roomMessagesLink: getNode("#roomMessagesLink"),
 privateMessagesLink: getNode("#privateMessagesLink"),
 closePrivateMessageModal: getNode('#closePrivateMessageModal'),
 privateMessageDiv: getNode('#privateMessages'),
 privateMessageTextarea: getNode('#privateMessage'),
 sendPrivateMessageButton: getNode('#sendPrivateMessage'),
 openPrivateMessageModal: getNode('#showPrivateMessageModal'),
 $enterChatModal: $(getNode('#enter-chat-modal')),
 $newRoomModal: $(getNode('#create-room-modal')),
 removeRoomModal: getNode('#removeRoomModal'),
 showNewRoomModal: getNode('.showNewRoomModal', true),
 showRemoveRoomModal: getNode('.showRemoveRoomModal', true),
 closeRemoveRoomModal: getNode('#closeRemoveRoomModal'),
 codeInput: getNode('#code'),
 showRoomPasswordModal: getNode('#showRoomPasswordModal'),
 closeRoomPasswordModal: getNode('#closeRoomPasswordModal'),
 passwordInput: getNode('#passwordInput'),
 roomNameField: getNode('#roomName'),
 roomPasswordField: getNode('#roomPassword'),
 roomPasswordRepeatField: getNode('#roomPasswordRepeat'),
 roomCodeField: getNode('#roomCode'),
 roomCodeRepeatField: getNode('#roomCodeRepeat'),
 showInputNameModal: getNode('#showInputNameModal'),
 closeInputNameModal: getNode('#closeInputNameModal'),
 closeNewRoomModal: getNode('#closeNewRoomModal'),
 messageInput: getNode('.message-input input'),
 messageDiv: getNode('#public-messages'),
 $nameInput: $(getNode('#username-input')),
 identificationCodeInput: getNode('#identificationCode'),
 header: getNode('.header'),
 roomLists: getNode('.roomsSidebar ul', true),
 peopleLists: getNode('.peopleSidebar ul', true),
 peopleSidebar: getNode('.peopleSidebar'),
 roomsSidebar: getNode('.roomsSidebar'),
 roomsSidebarSmall: getNode('.roomsSidebarSmall'),
 peopleSidebarSmall: getNode('.peopleSidebarSmall'),
 roomsSidebarContent: getNode('.roomsSidebar section'),
 peopleSidebarContent: getNode('.peopleSidebar section'),
 roomsButton: getNode('.header img:nth-child(1)'),
 peopleButton: getNode('.header img:nth-child(2)'),
 roomsIcon: getNode('.roomsIcon'),
 peopleIcon: getNode('.peopleIcon')
 };
 return elements;
 }*/

//
//var elements = getElements();
//var activeItemName = 'global';
//
//elements.messageInput.addEventListener('focus', function () {
//    socket.emit('userIsTyping', activeItemName);
//});
//
//elements.messageInput.addEventListener('blur', function () {
//    socket.emit('userStopTyping', activeItemName);
//});
//
//var isScreenLarge = window.outerWidth > 640 ? true : false;
//
//transformSidebarsForSmallScreenSizes();
//
//socket.emit('populateChat');
//socket.on('populateChat', function (rooms, people, messages) {
//    var i;
//    for (i = 0; i < rooms.length; ++i) {
//        addListItem(elements.roomLists, rooms[i], 'room');
//    }
//
//    for (i = 0; i < messages.length; ++i) {
//        addMessage(elements.messageDiv, messages[i]);
//    }
//
//    for (i = 0; i < people.length; ++i) {
//        var personItems = addListItem(elements.peopleLists, people[i]);
//        personItems[0].addEventListener('click', privateMessageHandler);
//        personItems[1].addEventListener('click', privateMessageHandler);
//    }
//
//    elements.roomItems = getNode('.roomsSidebar ul li:not(.buttons)', true);
//    for (i = 0; i < elements.roomItems.length; ++i) {
//        elements.roomItems[i].addEventListener('click', changeRoomHandler);
//    }
//
//    // elements.peopleItems = getNode('.peopleSidebar ul li', true);
//    // for(i = 0; i < elements.peopleItems.length; ++i) {
//    // 	elements.peopleItems[i].addEventListener('click', privateMessageHandler);
//    // }
//
//    elements.activeItem = getNode('.activeItem', true);
//});
//
//function privateMessageHandler() {
//    userId = this.className;
//    elements.openPrivateMessageModal.click();//dispatchEvent(new MouseEvent('click'));
//    isPrivateMessageModalOpened = true;
//    elements.privateMessageTextarea.focus();
//    elements.privateMessageTextarea.select();
//}
//
//function sendPrivateMessage(e) {
//    var whitespacePattern = /^\s*$/;
//
//    if (whitespacePattern.test(elements.privateMessageTextarea.value)) {
//        socket.emit('message', {
//            isMessagePrivate: true,
//            whoToSend: userId,
//            message: elements.privateMessageTextarea.value
//        });
//    } else {
//        elements.closePrivateMessageModal.click();//dispatchEvent(new MouseEvent('click'));
//        isPrivateMessageModalOpened = false;
//        socket.emit('message', {
//            isMessagePrivate: true,
//            whoToSend: userId,
//            message: elements.privateMessageTextarea.value
//        });
//    }
//}
//
//// ------------------ refactoring tasks -------------------- //
//
//// choose standard font
//// add date to some notifications
//// хешировать пароли
//// add close modal behavior on esc (done)
//// add close buttons to individually close each block (.roomsSidebar and .peopleSidebar)
//// fix date
//// add sound on notification (done)
//// add tooltips on hover
//// put focus on message input when changing between room and private messages (done)
//// remove outlines when pressing tab key to move between elements on page
//// change keyup -> keypress
//// chage img tags on background-image property
//// make cloner
//// exact names
//// findOne method
//// make len variable global
//// on esc close all opened modals
//// hide pen when somebody writes private message
//// watch all connections between users into the database (like who's having private conversation with who etc.)
//
//// -------------- future features -----------------
//
//// add file uploading
//// add avatars
//// add approvement button that message is red
//
//elements.privateMessageTextarea.addEventListener('keypress', function (e) {
//    if (e.ctrlKey && e.keyCode == 13) {
//        return;
//    } else if (e.keyCode == 13) {
//        sendPrivateMessage(e);
//        e.preventDefault();
//    }
//});
//
//elements.sendPrivateMessageButton.addEventListener('click', function (e) {
//    sendPrivateMessage(e);
//});
//
//elements.passwordInput.addEventListener('keyup', function (e) {
//    changeRoomFormSender(e);
//});
//
//function removeRoomFormSender(e) {
//    if (e.keyCode == 13 || e.type === 'click') {
//        socket.emit('removeRoom', {roomName: activeItemName, code: elements.codeInput.value});
//        elements.codeInput.value = '';
//    }
//}
//
//function changeRoomFormSender(e) {
//    if (e.keyCode == 13 || e.type === 'click') {
//        socket.emit('changeRoom', {newRoom: activeItemName, newRoomPassword: elements.passwordInput.value});
//        elements.passwordInput.value = '';
//    }
//}
//
//function newRoomFormSender(e) {
//
//    if (e.keyCode == 13 || e.type === 'click') {
//        socket.emit('createRoom', {
//            roomName: elements.roomNameField.value,
//            roomPassword: elements.roomPasswordField.value,
//            roomPasswordRepeat: elements.roomPasswordRepeatField.value,
//            roomCode: elements.roomCodeField.value,
//            roomCodeRepeat: elements.roomCodeRepeatField.value
//        });
//    }
//}
//
//function cleanNewRoomForm() {
//    elements.roomPasswordField.value = '';
//    elements.roomPasswordRepeatField.value = '';
//    elements.roomCodeField.value = '';
//    elements.roomCodeRepeatField.value = '';
//}
//
//elements.showNewRoomModal[0].addEventListener('click', function () {
//    isNewRoomModalOpened = true;
//    cleanNewRoomForm();
//    elements.roomNameField.focus();
//    elements.roomNameField.select();
//});
//
//elements.showNewRoomModal[1].addEventListener('click', function () {
//    isNewRoomModalOpened = true;
//    cleanNewRoomForm();
//    elements.roomNameField.focus();
//    elements.roomNameField.select();
//});
//
//elements.showRemoveRoomModal[0].addEventListener('click', function () {
//
//    isRemoveRoomModalOpened = true;
//
//    elements.codeInput.value = '';
//
//    if (elements.pTag) {
//        elements.codeInput.parentNode.removeChild(elements.pTag);
//        elements.pTag = undefined;
//    }
//    socket.emit('removeRoom', activeItemName);
//    elements.codeInput.focus();
//});
//
//elements.showRemoveRoomModal[1].addEventListener('click', function () {
//
//    isRemoveRoomModalOpened = true;
//
//    elements.codeInput.value = '';
//
//    if (elements.pTag) {
//        elements.codeInput.parentNode.removeChild(elements.pTag);
//        elements.pTag = undefined;
//    }
//    socket.emit('removeRoom', activeItemName);
//    elements.codeInput.focus();
//});
//
//elements.roomNameField.addEventListener('keyup', function (e) {
//    newRoomFormSender(e);
//});
//
//elements.roomPasswordField.addEventListener('keyup', function (e) {
//    newRoomFormSender(e);
//});
//
//elements.roomPasswordRepeatField.addEventListener('keyup', function (e) {
//    newRoomFormSender(e);
//});
//
//elements.roomCodeField.addEventListener('keyup', function (e) {
//    newRoomFormSender(e);
//});
//
//elements.roomCodeRepeatField.addEventListener('keyup', function (e) {
//    newRoomFormSender(e);
//});
//
//elements.codeInput.addEventListener('keyup', function (e) {
//    removeRoomFormSender(e);
//});
//
//socket.on('removeRoom', function (data) {
//    if (data.peopleCount && data.peopleCount !== 0) {
//        var pTag = document.createElement('p');
//        pTag.style.color = '#7083d2';
//        pTag.innerHTML = 'There\'re <strong id="peopleCountLeftInRoom">' + data.peopleCount + '</strong> men at this room. When room gets removed all people will be moved to "global" room';
//        elements.codeInput.parentNode.insertBefore(pTag, elements.codeInput);
//        elements.pTag = pTag;
//    }
//
//    if (data.globalRoomInfo) {
//        updatePeopleCounters(data.globalRoomInfo);
//    }
//
//    if (data.message) {
//        notification(data.message, 'info', 15000);
//        // toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
//
//        if (data.self) {
//            elements.closeRemoveRoomModal.click();//dispatchEvent(new MouseEvent('click'));
//            isRemoveRoomModalOpened = false;
//        }
//
//        if (userIdForPrivateConversation) {
//            userIdForPrivateConversation = null;
//            elements.messageInput.placeholder = 'Message:';
//        }
//
//        if (data.roomId) {
//            var removedRoomItems = getNode('.' + data.roomId, true);
//            removedRoomItems[0].parentNode.removeChild(removedRoomItems[0]);
//            removedRoomItems[1].parentNode.removeChild(removedRoomItems[1]);
//        }
//
//        if (data.user) {
//
//            var i;
//            elements.activeItem = getNode('.roomsSidebar ul li:first-child', true);
//            elements.activeItem[0].classList.add('activeItem');
//            elements.activeItem[1].classList.add('activeItem');
//
//            elements.peopleLists[0].innerHTML = '';
//            elements.peopleLists[1].innerHTML = '';
//            elements.messageDiv.innerHTML = '';
//
//            var len;
//
//            if (data.peopleFromGlobalRoom.length !== 0) {
//                len = data.peopleFromGlobalRoom.length;
//                for (i = 0; i < len; ++i) {
//                    personItems = addListItem(elements.peopleLists, data.peopleFromGlobalRoom[i]);
//                    personItems[0].addEventListener('click', privateMessageHandler);
//                    personItems[1].addEventListener('click', privateMessageHandler);
//                }
//            }
//
//            if (data.peopleFromRemovedRoom.length !== 0) {
//                len = data.peopleFromRemovedRoom.length;
//                for (i = 0; i < len; ++i) {
//                    if ('_' + socket.id !== data.peopleFromRemovedRoom[i]._id) {
//                        personItems = addListItem(elements.peopleLists, data.peopleFromRemovedRoom[i]);
//                        personItems[0].addEventListener('click', privateMessageHandler);
//                        personItems[1].addEventListener('click', privateMessageHandler);
//                    }
//                }
//            }
//
//            if (data.messages.length !== 0) {
//                for (i = 0; i < data.messages.length; ++i) {
//                    addMessage(elements.messageDiv, data.messages[i]);
//                }
//            }
//
//            var currentUserItems = addListItem(elements.peopleLists, data.user);
//            assignRenameHandlers(currentUserItems);
//        }
//    }
//});
//
//socket.on('transferPeopleFromRemovedRoom', function (peopleFromRemovedRoom) {
//    var len = peopleFromRemovedRoom.length;
//    for (var i = 0; i < len; ++i) {
//        personItems = addListItem(elements.peopleLists, peopleFromRemovedRoom[i]);
//        personItems[0].addEventListener('click', privateMessageHandler);
//        personItems[1].addEventListener('click', privateMessageHandler);
//    }
//});
//
//socket.on('createRoom', function (data) {
//    if (data.message) {
//        notification(data.message, 'info', 15000);
//        // toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
//    } else {
//        elements.closeNewRoomModal.click();//dispatchEvent(new MouseEvent('click'));
//        isNewRoomModalOpened = false;
//    }
//    var newRoomItem = addListItem(elements.roomLists, data.room, 'room');
//
//    newRoomItem[0].addEventListener('click', changeRoomHandler);
//    newRoomItem[1].addEventListener('click', changeRoomHandler);
//
//    if (socket.status === 'doctor') {
//        var subscribtionButton = document.createElement('img');
//        subscribtionButton.className = 'subscribtionButton';
//        subscribtionButton.src = '/images/subscribtion.png';
//
//        var subscribtionButtons = [subscribtionButton, subscribtionButton.cloneNode(true)];
//
//        newRoomItem[0].appendChild(subscribtionButtons[0]);
//        newRoomItem[1].appendChild(subscribtionButtons[1]);
//
//
//        for (var i = 0; i < subscribtionButtons.length; ++i) {
//            subscribtionButtons[i].addEventListener('mouseenter', function (e) {
//                if (this.classList.contains('subscribed')) {
//                    this.src = '/images/unsubscribe.png';
//                } else {
//                    this.src = '/images/subscribe.png';
//                }
//            });
//            subscribtionButtons[i].addEventListener('mouseleave', function (e) {
//                if (this.classList.contains('subscribed')) {
//                    this.src = '/images/subscribed.png';
//                } else {
//                    this.src = '/images/subscribtion.png';
//                }
//            });
//
//            subscribtionButtons[i].addEventListener('click', function (e) {
//                e.stopPropagation();
//
//                var roomItemClass = this.parentNode.classList[0];
//                var subscribtionButtons = getNode('.' + roomItemClass + ' .subscribtionButton', true);
//                if (!this.classList.contains('subscribed')) {
//                    subscribtionButtons[0].src = '/images/subscribed.png';
//                    subscribtionButtons[1].src = '/images/subscribed.png';
//                    subscribtionButtons[0].className += ' subscribed';
//                    subscribtionButtons[1].className += ' subscribed';
//                } else {
//                    subscribtionButtons[0].src = '/images/subscribtion.png';
//                    subscribtionButtons[1].src = '/images/subscribtion.png';
//                    subscribtionButtons[0].className = 'subscribtionButton';
//                    subscribtionButtons[1].className = 'subscribtionButton';
//                }
//
//                var roomName = this.parentNode.firstChild.textContent;
//                socket.emit('subscribe', roomName);
//            });
//        }
//    }
//});
//
//socket.on('openRoomPasswordModal', function () {
//    elements.passwordInput.value = '';
//    elements.showRoomPasswordModal.click();//dispatchEvent(new MouseEvent('click'));
//    isRoomPasswordModalOpened = true;
//    elements.passwordInput.focus();
//});
//
//elements.passwordInput.addEventListener('click', function (e) {
//    if (e.keyCode == 13) {
//        socket.emit('changeRoom', {password: this.value});
//    }
//});
//
//socket.on('changeRoom', function (data) {
//    var personItems;
//    if (data.forAllClients) {
//        if (data.oldRoomInfo.password === '' || activeItemName === data.oldRoomInfo.name) {
//            updatePeopleCounters(data.oldRoomInfo);
//        }
//        if (data.newRoomInfo.password === '' || activeItemName === data.newRoomInfo.name) {
//            updatePeopleCounters(data.newRoomInfo);
//        }
//    } else if (data.people) {
//
//        if (userIdForPrivateConversation) {
//            userIdForPrivateConversation = null;
//            elements.messageInput.placeholder = 'Message:';
//        }
//
//        var lockImgs;
//        if (data.isRoomPrivate) {
//            elements.closeRoomPasswordModal.click();//dispatchEvent(new MouseEvent('click'));
//            isRoomPasswordModalOpened = false;
//        }
//        if (data.newRoomInfo.password !== '') {
//
//            elements.activeItem[0].classList.remove('activeItem');
//            elements.activeItem[1].classList.remove('activeItem');
//
//            elements.activeItem = getNode('.' + data.newRoomInfo._id, true);
//            elements.activeItem[0].classList.add('activeItem');
//            elements.activeItem[1].classList.add('activeItem');
//
//            lockImgs = getNode('.' + data.newRoomInfo._id + ' .lock', true);
//            var newRoomItems = [lockImgs[0].parentNode, lockImgs[1].parentNode];
//            newRoomItems[0].removeChild(lockImgs[0]);
//            newRoomItems[1].removeChild(lockImgs[1]);
//
//            if (socket.status === 'doctor') {
//                newRoomItems[0].insertBefore(document.createElement('span'), newRoomItems[0].lastChild);
//                newRoomItems[1].insertBefore(document.createElement('span'), newRoomItems[1].lastChild);
//
//            } else {
//                newRoomItems[0].appendChild(document.createElement('span'));
//                newRoomItems[1].appendChild(document.createElement('span'));
//            }
//        }
//        updatePeopleCounters(data.newRoomInfo);
//
//        if (data.oldRoomInfo.password !== '') {
//            var oldRoomItems = getNode('.' + data.oldRoomInfo._id, true);
//            var lockImg = document.createElement('img');
//            lockImg.className = 'lock';
//            lockImg.src = 'images/lock.png';
//            lockImgs = [lockImg, lockImg.cloneNode()];
//            if (socket.status === 'doctor') {
//                var peopleCounters = getNode('.' + data.oldRoomInfo._id + ' span:nth-child(2)', true);
//                var subscribtionButtons = getNode('.' + data.oldRoomInfo._id + ' .subscribtionButton', true);
//                oldRoomItems[0].removeChild(peopleCounters[0]);
//                oldRoomItems[1].removeChild(peopleCounters[1]);
//                oldRoomItems[0].insertBefore(lockImgs[0], subscribtionButtons[0]);
//                oldRoomItems[1].insertBefore(lockImgs[1], subscribtionButtons[1]);
//            } else {
//                oldRoomItems[0].removeChild(oldRoomItems[0].lastChild);
//                oldRoomItems[1].removeChild(oldRoomItems[1].lastChild);
//                oldRoomItems[0].appendChild(lockImgs[0]);
//                oldRoomItems[1].appendChild(lockImgs[1]);
//            }
//        } else {
//            updatePeopleCounters(data.oldRoomInfo);
//        }
//
//        var i;
//        elements.peopleLists[0].innerHTML = '';
//        elements.peopleLists[1].innerHTML = '';
//        elements.messageDiv.innerHTML = '';
//        if (data.people.length !== 0) {
//            for (i = 0; i < data.people.length; ++i) {
//                personItems = addListItem(elements.peopleLists, data.people[i]);
//                personItems[0].addEventListener('click', privateMessageHandler);
//                personItems[1].addEventListener('click', privateMessageHandler);
//            }
//        }
//        if (data.messages.length !== 0) {
//            for (i = 0; i < data.messages.length; ++i) {
//                addMessage(elements.messageDiv, data.messages[i]);
//            }
//        }
//        var currentUserItems = addListItem(elements.peopleLists, data.user);
//        assignRenameHandlers(currentUserItems);
//    } else {
//        if (data.whoLeft) {
//            if (userIdForPrivateConversation === data.whoLeft._id) {
//                userIdForPrivateConversation = null;
//                elements.messageInput.placeholder = 'Message:';
//            }
//            removeListItem(data.whoLeft._id);
//        } else {
//            personItems = addListItem(elements.peopleLists, data.user);
//            personItems[0].addEventListener('click', privateMessageHandler);
//            personItems[1].addEventListener('click', privateMessageHandler);
//        }
//        notification(data.message, 'info', 15000);
//        // toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
//    }
//});
//
//window.addEventListener('resize', function () {
//    transformSidebarsForSmallScreenSizes();
//});
//
//elements.closeRoomsSidebarSmallButton.addEventListener('click', function (e) {
//    elements.roomsButton.click();//dispatchEvent(new MouseEvent('click'));
//    roomsOpened = false;
//});
//
//elements.closePeopleSidebarSmallButton.addEventListener('click', function (e) {
//    elements.peopleButton.click();//dispatchEvent(new MouseEvent('click'));
//    peopleOpened = false;
//});
//
//elements.header.addEventListener('click', panelHandler);
//elements.messageDiv.addEventListener('click', panelHandler);
//elements.privateMessageDiv.addEventListener('click', panelHandler);
//elements.messageInput.addEventListener('click', panelHandler);
//document.addEventListener('keyup', function (e) {
//    if (e.keyCode == 27 && !(isPrivateMessageModalOpened || isRoomPasswordModalOpened
//        || isNewRoomModalOpened || isRemoveRoomModalOpened)) {
//        panelHandler(e);
//    }
//});
//
//var roomsOpened = false, peopleOpened = false;
//
//elements.roomsButton.addEventListener('click', function (e) {
//    roomsOpened = !roomsOpened;
//    e.stopPropagation();
//});
//
//elements.peopleButton.addEventListener('click', function (e) {
//    peopleOpened = !peopleOpened;
//    e.stopPropagation();
//});
//
//function renameHandler(currentUserItem) {
//
//    renameUserItem = currentUserItem;
//    renameUserItem.id = 'clearPaddingLeft';
//
//    var renameField = document.createElement('input');
//    var userNameSpan = renameUserItem.firstChild;
//    oldUserName = userNameSpan.textContent;
//    renameField.type = 'text';
//    renameField.id = 'renameInput';
//    renameField.value = oldUserName;
//    renameUserItem.innerHTML = '';
//    renameUserItem.appendChild(renameField);
//    renameField.focus();
//    renameField.select();
//
//    renameField.addEventListener('keyup', function (e) {
//        if (e.keyCode === 13) {
//            socket.emit('rename', this.value);
//        }
//    });
//}
//
//window.addEventListener('click', function (e) {
//    if (renameUserItem) {
//        renameUserItem.innerHTML = '<span>' + oldUserName + '</span>';
//        renameUserItem.id = '';
//        renameUserItem = null;
//    }
//});
//
//socket.on('rename', function (data) {
//    if (data.self) {
//        renameUserItem.innerHTML = '<span>' + data.newUserName + '</span>';
//        renameUserItem.id = '';
//        renameUserItem = null;
//    } else {
//        var renamedUserItems = getNode('.' + data.userId, true);
//        renamedUserItems[0].innerHTML = '<span>' + data.newUserName + '</span>';
//        renamedUserItems[1].innerHTML = '<span>' + data.newUserName + '</span>';
//
//        notification(data.message, 'info', 15000);
//    }
//
//});
//
//socket.on('joined', function (data) {
//if (data.message) {
//notification(data.message, 'info', 15000);
// toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });

//    var personItems = addListItem(elements.peopleLists, data.user);
//    personItems[0].addEventListener('click', privateMessageHandler);
//    personItems[1].addEventListener('click', privateMessageHandler);
//} else if (data.status) {
//
//    elements.messageInput.focus();

//if (data.status === 'doctor') {
//    socket.status = 'doctor';
//    var roomItems = getNode('.roomsSidebar li', true);
//    for (var i = 0; i < roomItems.length; ++i) {
//        var subscribtionButton = document.createElement('img');
//        subscribtionButton.src = '/images/subscribtion.png';
//        subscribtionButton.className = 'subscribtionButton';
//        roomItems[i].appendChild(subscribtionButton);
//    }
//
//    var subscribtionButtons = getNode('.subscribtionButton', true);
//
//    var len = subscribtionButtons.length;
//
//    for (var i = 0; i < len; ++i) {
//        subscribtionButtons[i].addEventListener('mouseenter', function (e) {
//            if (this.classList.contains('subscribed')) {
//                this.src = '/images/unsubscribe.png';
//            } else {
//                this.src = '/images/subscribe.png';
//            }
//        });
//        subscribtionButtons[i].addEventListener('mouseleave', function (e) {
//            if (this.classList.contains('subscribed')) {
//                this.src = '/images/subscribed.png';
//            } else {
//                this.src = '/images/subscribtion.png';
//            }
//        });
//
//        subscribtionButtons[i].addEventListener('click', function (e) {
//            e.stopPropagation();
//
//            var roomItemClass = this.parentNode.classList[0];
//            var subscribtionButtons = getNode('.' + roomItemClass + ' .subscribtionButton', true);
//            var roomName = this.parentNode.firstChild.textContent;
//            if (!this.classList.contains('subscribed')) {
//                subscribtionButtons[0].src = '/images/subscribed.png';
//                subscribtionButtons[1].src = '/images/subscribed.png';
//                subscribtionButtons[0].className += ' subscribed';
//                subscribtionButtons[1].className += ' subscribed';
//                socket.emit('subscribe', roomName);
//            } else {
//                subscribtionButtons[0].src = '/images/subscribtion.png';
//                subscribtionButtons[1].src = '/images/subscribtion.png';
//                subscribtionButtons[0].className = 'subscribtionButton';
//                subscribtionButtons[1].className = 'subscribtionButton';
//                socket.emit('unsubscribe', roomName);
//            }
//        });
//    }
//}
//elements.closeInputNameModal.click();//dispatchEvent(new MouseEvent('click'));


//        var currentUserItems = addListItem(elements.peopleLists, data.user);
//
//        assignRenameHandlers(currentUserItems);
//
//        window.onunload = function () {
//            socket.emit('left');
//        };
//    } else if (data.room) {
//        updatePeopleCounters(data.room);
//    }
//    $("#enter-chat-modal").modal('hide');
//});
//
//function sendMessage() {
//    if (userIdForPrivateConversation) {
//        socket.emit('message', {
//            isMessagePrivate: true,
//            whoToSend: userIdForPrivateConversation,
//            message: elements.messageInput.value
//        });
//    } else {
//        socket.emit('message', {message: elements.messageInput.value});
//    }
//    elements.messageInput.value = '';
//}
//
//elements.sendMessageButton.addEventListener('click', function (e) {
//    sendMessage();
//});
//
//elements.messageInput.addEventListener('keyup', function (e) {
//    if (e.keyCode == 13) {
//        sendMessage();
//    }
//});
//
//socket.on('notifySubscriber', function (info) {
//    notification(info, 'info', 60000);
//    // toastr.success(info, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 0, preventDuplicates: true, closeHtml: '<button>hello</button>' });
//});
//
//socket.on('userIsTyping', function (userId) {
//    var li = getNode('.' + userId, true);
//    var img = document.createElement('img');
//    img.src = 'images/pen.gif';
//    img.className = 'userIsTypingIcon';
//
//    li[0].insertBefore(img, li[0].firstChild);
//    li[1].insertBefore(img.cloneNode(), li[1].firstChild);
//    // li[0].appendChild(img);
//    // li[1].appendChild(img.cloneNode());
//});
//
//socket.on('userStopTyping', function (userId) {
//    var li = getNode('.' + userId, true);
//    // li[0].removeChild(li[0].lastChild);
//    // li[1].removeChild(li[1].lastChild);
//    li[0].removeChild(li[0].firstChild);
//    li[1].removeChild(li[1].firstChild);
//});
//
//socket.on('warning', function (data) {
//    if (data.roomName) {
//        elements.roomNameField.value = data.roomName;
//    }
//    if (data.identificationCode) {
//        elements.identificationCodeInput.value = '';
//    }
//
//    notification(data.message, 'warning', 3000);
//    // toastr.warning(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
//});
//
//elements.roomMessagesLink.addEventListener('click', function (e) {
//    if (isPrivateMessagesBlockOpened) {
//        elements.messageDiv.style.display = 'block';
//        elements.roomMessagesLink.classList.remove('unactiveMessagesLink');
//
//        elements.privateMessageDiv.style.display = 'none';
//        elements.privateMessagesLink.classList.add('unactiveMessagesLink');
//        elements.messageInput.select();
//        elements.messageInput.focus();
//
//        elements.messageDiv.scrollTop = elements.messageDiv.scrollHeight;
//
//        isPrivateMessagesBlockOpened = false;
//    }
//});
//
//elements.privateMessagesLink.addEventListener('click', function (e) {
//    if (!isPrivateMessagesBlockOpened) {
//        elements.messageDiv.style.display = 'none';
//        elements.roomMessagesLink.classList.add('unactiveMessagesLink');
//
//        elements.privateMessageDiv.style.display = 'block';
//        elements.privateMessagesLink.classList.remove('unactiveMessagesLink');
//        elements.messageInput.select();
//        elements.messageInput.focus();
//
//        elements.privateMessageDiv.scrollTop = elements.privateMessageDiv.scrollHeight;
//
//        isPrivateMessagesBlockOpened = true;
//    }
//});
//
//socket.on('message', function (data) {
//    if (data.isPrivate) {
//        if (data.sender) {
//            notification(data.sender + ' send you private message: "' + data.message.text + '".', 'info', 0);
//            // toastr.success(data.sender + ' send you private message: "' + data.message.text + '".', null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
//            addMessage(elements.privateMessageDiv, data.message);
//        } else {
//
//            if (userIdForPrivateConversation && elements.privateMessageDiv.style.display === ''
//                || elements.privateMessageDiv.style.display === 'none') {
//                elements.messageDiv.style.display = 'none';
//                elements.roomMessagesLink.classList.add('unactiveMessagesLink');
//
//                elements.privateMessageDiv.style.display = 'block';
//                elements.privateMessagesLink.classList.remove('unactiveMessagesLink');
//
//                isPrivateMessagesBlockOpened = true;
//            }
//
//            addMessage(elements.privateMessageDiv, data.message);
//            elements.privateMessageDiv.scrollTop = elements.privateMessageDiv.scrollHeight;
//        }
//    } else {
//
//        if (data.self) {
//            if (elements.privateMessageDiv.style.display === 'block') {
//
//                elements.messageDiv.style.display = 'block';
//                elements.roomMessagesLink.classList.remove('unactiveMessagesLink');
//
//                elements.privateMessageDiv.style.display = 'none';
//                elements.privateMessagesLink.classList.add('unactiveMessagesLink');
//
//                isPrivateMessagesBlockOpened = false;
//            }
//        } else {
//            messageSound.play();
//        }
//
//        addMessage(elements.messageDiv, data.message);
//        elements.messageDiv.scrollTop = elements.messageDiv.scrollHeight;
//    }
//});
//
//socket.on('disablePrivateConversation', function (message) {
//    notification(message, 'info', 0);
//    // toastr.success(message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
//});
//
//function privateConversationHandler(e, cancelPrivateConversation) {
//
//    var privateConversationIcons = getNode('.privateConversation', true);
//
//    if (privateConversationIcons.length !== 0) {
//        removePrivateConversationIcons(privateConversationIcons);
//        // var oldUserItems = [privateConversationIcons[0].parentNode, privateConversationIcons[1].parentNode];
//        // oldUserItems[0].removeChild(privateConversationIcons[0]);
//        // oldUserItems[1].removeChild(privateConversationIcons[1]);
//        // oldUserItems[0].classList.remove('activeItem');
//        // oldUserItems[1].classList.remove('activeItem');
//        // oldUserItems[0].addEventListener('click', privateMessageHandler);
//        // oldUserItems[1].addEventListener('click', privateMessageHandler);
//
//    }
//
//    var userItems;
//    if (cancelPrivateConversation) {
//        socket.emit('disablePrivateConversation', userIdForPrivateConversation);
//
//        userItems = getNode('.' + userIdForPrivateConversation, true);
//        userItems[0].style.cursor = 'pointer';
//        userItems[1].style.cursor = 'pointer';
//
//        userIdForPrivateConversation = null;
//        elements.messageInput.placeholder = 'Message:';
//        return;
//    }
//
//    userItems = getNode('.' + userIdForPrivateConversation, true);
//    // userItems[0].classList.add('activeItem');
//    // userItems[1].classList.add('activeItem');
//
//    userItems[0].removeEventListener('click', privateMessageHandler);
//    userItems[1].removeEventListener('click', privateMessageHandler);
//
//    var cancelPrivateConversationIcon = document.createElement('img');
//    cancelPrivateConversationIcon.src = '/images/privateConversationIcon.png';
//    cancelPrivateConversationIcon.className = 'privateConversation';
//
//    cancelPrivateConversationIcon.addEventListener('mouseenter', function (e) {
//        this.src = '/images/cancelPrivateConversationIcon.png';
//    });
//
//    cancelPrivateConversationIcon.addEventListener('mouseleave', function (e) {
//        this.src = '/images/privateConversationIcon.png';
//    });
//
//    cancelPrivateConversationIcon.addEventListener('click', function (e) {
//        e.stopPropagation();
//        privateConversationHandler(e, true);
//    });
//
//    userItems[0].appendChild(cancelPrivateConversationIcon);
//
//    var cancelPrivateConversationIconClone = cancelPrivateConversationIcon.cloneNode(true);
//
//    cancelPrivateConversationIconClone.addEventListener('mouseenter', function (e) {
//        this.src = '/images/cancelPrivateConversationIcon.png';
//    });
//
//    cancelPrivateConversationIconClone.addEventListener('mouseleave', function (e) {
//        this.src = '/images/privateConversationIcon.png';
//    });
//
//    cancelPrivateConversationIconClone.addEventListener('click', function (e) {
//        e.stopPropagation();
//        privateConversationHandler(e, true);
//    });
//
//    userItems[1].appendChild(cancelPrivateConversationIconClone);
//
//    elements.closePrivateMessageModal.click();//dispatchEvent(new MouseEvent('click'));
//    isPrivateMessageModalOpened = false;
//}
//
//elements.privateConversationLink.addEventListener('click', function (e) {
//    socket.emit('establishPrivateConversation', userId);
//    userIdForPrivateConversation = userId;
//    socket.emit('getUserName', userIdForPrivateConversation);
//    privateConversationHandler(e);
//
//    var userItems = getNode('.' + userIdForPrivateConversation, true);
//    userItems[0].style.cursor = 'default';
//    userItems[1].style.cursor = 'default';
//
//    elements.messageInput.select();
//});
//
//socket.on('establishPrivateConversation', function (message) {
//    notification(message, 'info', 0);
//    // toastr.success(message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
//});
//
//socket.on('getUserName', function (userName) {
//    elements.messageInput.placeholder = 'Private message to ' + userName + ':';
//});
//
//function removePrivateConversationIcons(privateConversationIcons) {
//    var oldUserItems = [privateConversationIcons[0].parentNode, privateConversationIcons[1].parentNode];
//    oldUserItems[0].removeChild(privateConversationIcons[0]);
//    oldUserItems[1].removeChild(privateConversationIcons[1]);
//    oldUserItems[0].addEventListener('click', privateMessageHandler);
//    oldUserItems[1].addEventListener('click', privateMessageHandler);
//}
//
//socket.on('left', function (data) {
//
//    if (data.room) {
//        updatePeopleCounters(data.room);
//    } else {
//        if (data.user._id === userIdForPrivateConversation) {
//            removePrivateConversationIcons(getNode('.privateConversation', true));
//            userIdForPrivateConversation = null;
//            elements.messageInput.placeholder = 'Message:';
//        }
//
//        removeListItem(data.user._id);
//        notification(data.message, 'info', 15000);
//        // toastr.success(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
//    }
//});
//
//socket.on('disconnect', function () {
//    location.reload();
//});
//
//elements.showInputNameModal.click();//dispatchEvent(new MouseEvent('click'));


//
//elements.sendRoomCodeButton.addEventListener('click', function (e) {
//    removeRoomFormSender(e);
//});
//
//elements.createRoomButton.addEventListener('click', function (e) {
//    newRoomFormSender(e);
//});
//
//elements.sendPasswordButton.addEventListener('click', function (e) {
//    changeRoomFormSender(e);
//});
//

//
//elements.identificationCodeInput.addEventListener('keyup', function (e) {
//    joinedHandler(e);
//});
//
//window.addEventListener('keyup', function (e) {
//    if (e.keyCode === 27) {
//        if (renameUserItem) {
//            renameUserItem.innerHTML = '<span>' + oldUserName + '</span>';
//            renameUserItem.id = '';
//            renameUserItem = null;
//            return;
//        }
//
//        if (isPrivateMessageModalOpened) {
//            elements.closePrivateMessageModal.click();//dispatchEvent(new MouseEvent('click'));
//            isPrivateMessageModalOpened = false;
//        } else if (isRoomPasswordModalOpened) {
//            elements.closeRoomPasswordModal.click();//dispatchEvent(new MouseEvent('click'));
//            isRoomPasswordModalOpened = false;
//        } else if (isNewRoomModalOpened) {
//            elements.closeNewRoomModal.click();//dispatchEvent(new MouseEvent('click'));
//            isNewRoomModalOpened = false;
//        } else if (isRemoveRoomModalOpened) {
//            elements.closeRemoveRoomModal.click();//dispatchEvent(new MouseEvent('click'));
//            isRemoveRoomModalOpened = false;
//        }
//    }
//});
//});
