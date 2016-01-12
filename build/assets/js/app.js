;
$(function() {
    var socket = io('http://' + window.location.hostname + ':8000');
    var validErrorsSound = new Audio('/music/valid_errors.mp3');
    var messageSound = new Audio('/music/message.mp3');
    var invitationSound = new Audio('/music/invitation.mp3');
    var actionPerformedSound = new Audio('/music/action_performed.mp3');
    var privateMessageSound = new Audio('/music/private_message.mp3');
    var generalSound = new Audio('/music/enter_left.mp3');
    // dropzone config
    Dropzone.options.avatar = {
        dictDefaultMessage: "Avatar"
    };
    toastr.options = {
        "positionClass": "toast-top-right",
        "timeOut": 3000,
        "newestOnTop": false
    };
    $("#enter-chat-modal").modal({
        backdrop: 'static',
        keyboard: false
    });
    var isRoomsVisible = true,
        isPeopleVisible = true;
    var gridManager = {
        contentMarginLeft: 300,
        contentMarginRight: 300,
        isOverlayShown: false,
        isScreenWide: true,
        contentWidthCrop: 600,
        init: function() {
            this.defineInitialGrid();
            this.setupHandlers();
            return this;
        },
        defineInitialGrid: function() {
            if ($(window).width() >= 992) {
                $(".content").css({
                    "width": "calc(100% - " + this.contentWidthCrop + "px)",
                    "margin": "50px " + this.contentMarginRight + "px 0 " + this.contentMarginLeft + "px"
                });
            } else {
                isRoomsVisible = false;
                isPeopleVisible = false;
                this.contentMarginLeft = 0;
                this.contentMarginRight = 0;
                this.isScreenWide = false;
                this.contentWidthCrop = 600;
                $("#rooms-sidebar-button, #people-sidebar-button").removeClass("active");
                $("#rooms-sidebar, #people-sidebar").addClass("hidden");
                $("#rooms-sidebar ul, #people-sidebar ul").addClass("shadowless");
                //$("#toast-container").css("right", "12px");
                $(".content").css({
                    "width": "100%",
                    "margin": "50px 0 0 0"
                });
            }
        },
        setupHandlers: function() {
            $("#rooms-sidebar-button, #people-sidebar-button").on("click", this.togglingSidebarsHandler);
            $(window).on("resize", this.resizingWindowHandler);
            $(".content").on("click", this.clickOverlayHandler);
        },
        togglingSidebarsHandler: function() {
            var $this = $(this);
            var _this = gridManager;
            $this.toggleClass("active");
            if ($this.attr("id") === "rooms-sidebar-button") {
                $("#rooms-sidebar").toggleClass("hidden");
                isRoomsVisible = !isRoomsVisible;
            } else {
                $("#people-sidebar").toggleClass("hidden");
                isPeopleVisible = !isPeopleVisible;
                if (isPeopleVisible && $(window).width() >= 992) {
                    $("#toast-container").css("right", "310px");
                } else {
                    $("#toast-container").css("right", "10px");
                }
            }
            if ($(window).width() > 992) {
                _this.contentWidthCrop = isRoomsVisible && isPeopleVisible ? 600 : isRoomsVisible || isPeopleVisible ? 300 : 0;
                _this.contentMarginLeft = isRoomsVisible ? 300 : 0;
                _this.contentMarginRight = isPeopleVisible ? 300 : 0;
                $(".content").css({
                    "width": "calc(100% - " + _this.contentWidthCrop + "px)",
                    "margin": "50px " + _this.contentMarginRight + "px 0 " + _this.contentMarginLeft + "px"
                });
            } else {
                _this.toggleOverlay();
                $(".content").css({
                    "width": "100%",
                    "margin": "50px 0 0 0"
                });
            }
        },
        resizingWindowHandler: function() {
            var _this = gridManager;
            if ($(window).width() > 992 && !_this.isScreenWide) {
                if (isPeopleVisible) {
                    $("#toast-container").css("right", "310px");
                }
                $("#rooms-sidebar ul, #people-sidebar ul").removeClass("shadowless");
                _this.isScreenWide = true;
                _this.contentWidthCrop = isRoomsVisible && isPeopleVisible ? 600 : isRoomsVisible || isPeopleVisible ? 300 : 0;
                _this.contentMarginLeft = isRoomsVisible ? 300 : 0;
                _this.contentMarginRight = isPeopleVisible ? 300 : 0;
                $(".content").removeClass("shadowed").css({
                    "width": "calc(100% - " + _this.contentWidthCrop + "px)",
                    "margin": "50px " + _this.contentMarginRight + "px 0 " + _this.contentMarginLeft + "px"
                });
            } else if ($(window).width() <= 992 && _this.isScreenWide) {
                $("#toast-container").css("right", "10px");
                $("#rooms-sidebar ul, #people-sidebar ul").addClass("shadowless");
                _this.isScreenWide = false;
                _this.toggleOverlay();
                $(".content").css({
                    "width": "100%",
                    "margin": "50px 0 0 0"
                });
            }
        },
        clickOverlayHandler: function() {
            if ($(window).width() <= 992) {
                var _this = gridManager;
                if (_this.isOverlayShown) {
                    $("#toast-container").css("right", "10px");
                    $("#rooms-sidebar-button, #people-sidebar-button").removeClass("active");
                    $("#rooms-sidebar, #people-sidebar").addClass("hidden");
                    $(".content").removeClass("shadowed");
                    isRoomsVisible = false;
                    isPeopleVisible = false;
                    _this.isOverlayShown = false;
                }
            }
        },
        toggleOverlay: function() {
            var _this = gridManager;
            if (isRoomsVisible || isPeopleVisible) {
                $(".content").addClass("shadowed");
                _this.isOverlayShown = true;
            } else {
                $(".content").removeClass("shadowed");
                _this.isOverlayShown = false;
            }
        }
    };
    gridManager.init();
    $("#create-room-button").on("click", function() {
        $("#create-room-modal").modal().on("shown.bs.modal", function() {
            $("#room-name").focus();
        });
    });
    $("#delete-room-button").on("click", function() {
        $("#delete-room-modal").modal().on("shown.bs.modal", function() {
            $("#room-c-input").focus();
        });
    });
    //$("#people-sidebar li").on("click", function () {
    //    $("#private-message-modal").modal().on("shown.bs.modal", function () {
    //        $("#private-message-textarea").focus();
    //    });
    //});
    var newRoomId = "";
    $("#enter-room").on("click", function() {
        socket.emit("changeRoom", {
            newRoomId: newRoomId,
            password: $("#password").val()
        });
    });
    $("#password").on("keypress", function(e) {
        if (e.keyCode == 13) {
            socket.emit("changeRoom", {
                newRoomId: newRoomId,
                password: $("#password").val()
            });
        }
    });
    $("#delete-room").on("click", function() {
        socket.emit("deleteRoom", {
            roomId: newRoomId,
            code: $("#code").val()
        });
    });
    $("#code").on("keypress", function(e) {
        if (e.keyCode == 13) {
            socket.emit("deleteRoom", {
                roomId: newRoomId,
                code: $("#code").val()
            });
        }
    });
    socket.on('disconnect', function() {
        location.reload();
    });
    //$("#private-messages-button").on("click", function () {
    //    $("#private-messages").show();
    //    $("#public-messages").hide();
    //});
    //$("#public-messages-button").on("click", function () {
    //    $("#public-messages").show();
    //    $("#private-messages").hide();
    //});
    $("#send").on("click", function() {
        socket.emit("message", $("#message-input").val());
    });
    $("#message-input").on("keypress", function(e) {
        if (e.keyCode == 13) {
            socket.emit("message", $("#message-input").val());
        }
    });
    // keypress handler
    var messageTemplate = window.Handlebars.compile($("#message-template").html());
    var roomTemplate = window.Handlebars.compile($("#room-template").html());
    var userTemplate = window.Handlebars.compile($("#user-template").html());
    var typingTemplate = window.Handlebars.compile($("#typing-template").html());
    socket.on("message", function(message) {
        // message.myMessage = message.myself ? "my-message" : "";
        var shouldScroll = true;
        if ($("#messages")[0].scrollTop + $("#messages")[0].clientHeight !== $("#messages")[0].scrollHeight) {
            shouldScroll = false;
        }
        $("#messages").append(messageTemplate(message)).find("time:last-child").timeago();
        if (shouldScroll) {
            $("#messages").prop("scrollTop", $("#messages").prop("scrollHeight"));
        }
        if (message.myself) {
            $("#message-input").val("");
        } else {
            messageSound.play();
        }
        scaleMessage();
    });

    function scaleMessage() {
        $("#messages .media:last-child").addClass("scaledDown");
        setTimeout(function() {
            $("#messages .media:last-child").removeClass("scaledDown").addClass("scaledUp");
        }, 0.001);
    }
    $(window).on("resize", function() {
        console.log("scrollTop: " + $("#messages")[0].scrollTop);
        console.log("scrollHeight: " + $("#messages")[0].scrollHeight);
        console.log("scrollTop + clientHeight: " + ($("#messages")[0].scrollTop + $("#messages")[0].clientHeight));
    });

    function changeRoomHandler() {
        if ($(this).attr("id") === globalRoomId) {
            socket.emit("changeRoom", {
                newRoomId: globalRoomId,
                password: ""
            });
        } else {
            $("#room-password-modal").modal().on("shown.bs.modal", function() {
                $("#password").focus();
            });
        }
        newRoomId = $(this).attr("id");
    }
    socket.on("populateChat", function(data) {
        for (var i = data.roomsInfo.length - 1; 0 <= i; --i) {
            $("#rooms-sidebar ul").prepend(roomTemplate(data.roomsInfo[i]));
        }
        $("#rooms-sidebar ul li:first-child").addClass("active");
        $("#rooms-sidebar li:not(.active)").on("click", changeRoomHandler);
        globalRoomId = $("#rooms-sidebar ul li:first-child").attr("id");
        for (var i = 0; i < data.messagesInfo.length; ++i) {
            $("#messages").append(messageTemplate(data.messagesInfo[i]));
        }
        $("#messages").prop("scrollTop", $("#messages").prop("scrollHeight"));
        for (var i = 0; i < data.peopleInfo.length; ++i) {
            $("#people-sidebar ul").prepend(userTemplate(data.peopleInfo[i]));
        }
        $("time").timeago();
    });
    $("html").show();

    function joinedHandler(e) {
        if (e.type === 'click' || e.keyCode == 13) {
            socket.emit('joined', $("#username").val());
        }
    }

    function addNotification(message, type) {
        switch (type) {
            case "privateMessage":
                window.toastr.success(message);
                privateMessageSound.play();
                break;
            case "invitation":
                window.toastr.info(message);
                invitationSound.play();
                break;
            case "actionPerformed":
                window.toastr.success(message);
                actionPerformedSound.play();
                break;
            case "general":
                window.toastr.info(message);
                generalSound.play();
                break;
            case "validErrors":
                window.toastr.error(message);
                validErrorsSound.play();
        }
        // TODO
        if (!isPeopleVisible || isPeopleVisible && $(window).width() < 992) {
            $("#toast-container").css({
                "transition": "none",
                "right": "10px"
            });
        }
    }
    socket.on("joined", function(data) {
        if (data.hasOwnProperty("myself")) {
            socket.on("notification", function(notificationInfo) {
                addNotification(notificationInfo.message, notificationInfo.type);
            });
            $("#enter-chat-modal").modal("hide");
            $("#people-sidebar ul").prepend(userTemplate(data)).find("li:first-child").addClass("active");
            socketId = data._id;
            globalRoomId = currentRoomId = data.globalRoomId;
            $("#message-input").focus();
            $("#messages").prop("scrollTop", $("#messages").prop("scrollHeight"));
        } else {
            $("#people-sidebar ul").prepend(userTemplate(data));
        }
    });
    $("#enter-chat-button").on('click', joinedHandler);
    $("#username").on('keypress', joinedHandler);
    // create room
    function addErrorState($input, errorMsg) {
        //noinspection JSValidateTypes
        $input.addClass("form-control-danger").siblings(".invalid").text(errorMsg).parent().addClass("has-danger");
    }

    function removeErrorState($input) {
        //noinspection JSValidateTypes
        $input.removeClass("form-control-danger").parent().removeClass("has-danger").find(".invalid").text("");
    }

    function updateValidationErrors(modalId, errors) {
        $("#" + modalId + " .form input").each(function(index, input) {
            var $input = $(input),
                inputId = $input.attr("id");
            if (!$input.hasClass("form-control-danger") && errors.hasOwnProperty(inputId)) {
                addErrorState($input, errors[inputId]);
            } else if ($input.hasClass("form-control-danger") && !errors.hasOwnProperty(inputId)) {
                removeErrorState($input);
            }
        });
    };

    function getInputsData($inputs) {
        var formData = {};
        $inputs.each(function(index, input) {
            var $input = $(input);
            formData[$input.attr("id")] = $input.val();
        });
        return formData;
    }

    function clearInputs($inputs) {
        $inputs.each(function(index, input) {
            var $input = $(input);
            removeErrorState($input);
            $input.val("");
        });
    }
    $("#create").on("click", function() {
        socket.emit("createRoom", getInputsData($("#create-room-modal .form input")));
    });
    $("#room-name, #room-password, #room-password-confirm, #room-code, #room-code-confirm").on("keypress", function(e) {
        if (e.keyCode == 13) {
            socket.emit("createRoom", getInputsData($("#create-room-modal .form input")));
        }
    });
    socket.on("createRoom", function(data) {
        $("#rooms-sidebar ul").append(roomTemplate(data.roomInfo));
        $("#rooms-sidebar ul li:last-child").on("click", changeRoomHandler);
        $("#create-room-modal").modal("hide");
        clearInputs($("#create-room-modal .form input"));
    });
    socket.on("validErrors", function(validationInfo) {
        validErrorsSound.play();
        updateValidationErrors(validationInfo.modalId, validationInfo.errors);
    });
    $(window).on("unload", function() {
        socket.emit("disconnect");
    });
    socket.on("left", function(data) {
        $("#" + data.userId).remove();
    });
    socket.on("changeRoom", function(data) {
        if (data.peopleFromNewRoom) {
            $("#people-sidebar ul").text("");
            for (var i = 0; i < data.peopleFromNewRoom.length; ++i) {
                $("#people-sidebar ul").prepend(userTemplate(data.peopleFromNewRoom[i]));
            }
            $("#people-sidebar ul").prepend(userTemplate(data.userInfo)).find("li:first-child").addClass("active");
            $("#rooms-sidebar ul li.active").removeClass("active").on("click", changeRoomHandler);
            $("#" + data.newRoomId).addClass("active").off("click", changeRoomHandler);
            $("#room-password-modal").modal("hide");
            clearInputs($("#room-password-modal .form input"));
            currentRoomId = data.newRoomId;
            $("#messages").text("");
            for (var i = 0; i < data.messages.length; ++i) {
                $("#messages").append(messageTemplate(data.messages[i]));
            }
            $("#messages").prop("scrollTop", $("#messages").prop("scrollHeight"));
            $("#message-input").focus();
            $("time").timeago();
        } else if (data.status === "left") {
            $("#" + data._id).remove();
        } else {
            $("#people-sidebar ul").prepend(userTemplate(data));
        }
    });
    socket.on("deleteRoomItem", function(roomId) {
        $("#" + roomId).remove();
    });
    socket.on("updatePeopleCounters", function(data) {
        $("#" + data.newRoomInfo._id + " span").text(data.newRoomInfo.peopleCount);
        if (data.oldRoomInfo) {
            $("#" + data.oldRoomInfo._id + " span").text(data.oldRoomInfo.peopleCount);
        }
    });
    var socketId = "";
    var globalRoomId = "";
    var currentRoomId = "";
    socket.on("deleteRoom", function(data) {
        if (data.myself === true) {
            $("#room-password-modal").modal("hide");
            clearInputs($("#room-password-modal"));
            if (globalRoomId === currentRoomId) {
                for (var i = 0; i < data.peopleFromDeletedRoom.length; ++i) {
                    $("#people-sidebar ul").prepend(userTemplate(data.peopleFromDeletedRoom[i]));
                }
                return;
            } else if (currentRoomId !== data.roomId) {
                return;
            }
        }
        if (data.global === true) {
            for (var i = 0; i < data.peopleFromDeletedRoom.length; ++i) {
                $("#people-sidebar ul").prepend(userTemplate(data.peopleFromDeletedRoom[i]));
            }
        } else {
            $("#" + globalRoomId).addClass("active");
            currentRoomId = globalRoomId;
            $("#people-sidebar ul").html("");
            for (var i = 0; i < data.peopleFromGlobalRoom.length; ++i) {
                $("#people-sidebar ul").prepend(userTemplate(data.peopleFromGlobalRoom[i]));
            }
            $("#messages").text("");
            for (var i = 0; i < data.messages.length; ++i) {
                $("#messages").append(messageTemplate(data.messages[i]));
            }
            $("#" + socketId).addClass("active");
            $("#" + globalRoomId).off("click", changeRoomHandler);
        }
    });
    $("#message-input").on("focus", function() {
        socket.emit("startTyping", socketId);
    });
    $("#message-input").on("blur", function() {
        socket.emit("stopTyping", socketId);
    });
    socket.on("startTyping", function(id) {
        $("#" + id).prepend(typingTemplate());
    });
    socket.on("stopTyping", function(id) {
        $("#" + id + " span").remove();
    });
    $(".signup-item").on("click", function() {
        $("#enter-chat-modal .form > div").hide();
        $(".signup").show();
        $(".nav-item a").removeClass("active");
        $(".signup-item a").addClass("active");
    });
    $(".incognito-item").on("click", function() {
        $("#enter-chat-modal .form > div").hide();
        $(".incognito").show();
        $(".nav-item a").removeClass("active");
        $(".incognito-item a").addClass("active");
    });
    $(".login-item").on("click", function() {
        $("#enter-chat-modal .form > div").hide();
        $(".login").show();
        $(".nav-item a").removeClass("active");
        $(".login-item a").addClass("active");
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
//        toastr.info(message, null, {
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
//    //    elements.peopleItems[i].addEventListener('click', privateMessageHandler);
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
//        // toastr.info(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
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
//        // toastr.info(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
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
//        // toastr.info(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
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
// toastr.info(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
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
//    // toastr.info(info, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 0, preventDuplicates: true, closeHtml: '<button>hello</button>' });
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
//            // toastr.info(data.sender + ' send you private message: "' + data.message.text + '".', null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
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
//    // toastr.info(message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
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
//    // toastr.info(message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
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
//        // toastr.info(data.message, null, { closeButton: true, positionClass: 'toast-bottom-right', timeOut: 3000, preventDuplicates: true });
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

/*
 *
 * More info at [www.dropzonejs.com](http://www.dropzonejs.com)
 *
 * Copyright (c) 2012, Matias Meno
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

(function() {
  var Dropzone, Emitter, camelize, contentLoaded, detectVerticalSquash, drawImageIOSFix, noop, without,
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  noop = function() {};

  Emitter = (function() {
    function Emitter() {}

    Emitter.prototype.addEventListener = Emitter.prototype.on;

    Emitter.prototype.on = function(event, fn) {
      this._callbacks = this._callbacks || {};
      if (!this._callbacks[event]) {
        this._callbacks[event] = [];
      }
      this._callbacks[event].push(fn);
      return this;
    };

    Emitter.prototype.emit = function() {
      var args, callback, callbacks, event, _i, _len;
      event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      this._callbacks = this._callbacks || {};
      callbacks = this._callbacks[event];
      if (callbacks) {
        for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
          callback = callbacks[_i];
          callback.apply(this, args);
        }
      }
      return this;
    };

    Emitter.prototype.removeListener = Emitter.prototype.off;

    Emitter.prototype.removeAllListeners = Emitter.prototype.off;

    Emitter.prototype.removeEventListener = Emitter.prototype.off;

    Emitter.prototype.off = function(event, fn) {
      var callback, callbacks, i, _i, _len;
      if (!this._callbacks || arguments.length === 0) {
        this._callbacks = {};
        return this;
      }
      callbacks = this._callbacks[event];
      if (!callbacks) {
        return this;
      }
      if (arguments.length === 1) {
        delete this._callbacks[event];
        return this;
      }
      for (i = _i = 0, _len = callbacks.length; _i < _len; i = ++_i) {
        callback = callbacks[i];
        if (callback === fn) {
          callbacks.splice(i, 1);
          break;
        }
      }
      return this;
    };

    return Emitter;

  })();

  Dropzone = (function(_super) {
    var extend, resolveOption;

    __extends(Dropzone, _super);

    Dropzone.prototype.Emitter = Emitter;


    /*
    This is a list of all available events you can register on a dropzone object.
    
    You can register an event handler like this:
    
        dropzone.on("dragEnter", function() { });
     */

    Dropzone.prototype.events = ["drop", "dragstart", "dragend", "dragenter", "dragover", "dragleave", "addedfile", "addedfiles", "removedfile", "thumbnail", "error", "errormultiple", "processing", "processingmultiple", "uploadprogress", "totaluploadprogress", "sending", "sendingmultiple", "success", "successmultiple", "canceled", "canceledmultiple", "complete", "completemultiple", "reset", "maxfilesexceeded", "maxfilesreached", "queuecomplete"];

    Dropzone.prototype.defaultOptions = {
      url: null,
      method: "post",
      withCredentials: false,
      parallelUploads: 2,
      uploadMultiple: false,
      maxFilesize: 256,
      paramName: "file",
      createImageThumbnails: true,
      maxThumbnailFilesize: 10,
      thumbnailWidth: 120,
      thumbnailHeight: 120,
      filesizeBase: 1000,
      maxFiles: null,
      params: {},
      clickable: true,
      ignoreHiddenFiles: true,
      acceptedFiles: null,
      acceptedMimeTypes: null,
      autoProcessQueue: true,
      autoQueue: true,
      addRemoveLinks: false,
      previewsContainer: null,
      hiddenInputContainer: "body",
      capture: null,
      dictDefaultMessage: "Drop files here to upload",
      dictFallbackMessage: "Your browser does not support drag'n'drop file uploads.",
      dictFallbackText: "Please use the fallback form below to upload your files like in the olden days.",
      dictFileTooBig: "File is too big ({{filesize}}MiB). Max filesize: {{maxFilesize}}MiB.",
      dictInvalidFileType: "You can't upload files of this type.",
      dictResponseError: "Server responded with {{statusCode}} code.",
      dictCancelUpload: "Cancel upload",
      dictCancelUploadConfirmation: "Are you sure you want to cancel this upload?",
      dictRemoveFile: "Remove file",
      dictRemoveFileConfirmation: null,
      dictMaxFilesExceeded: "You can not upload any more files.",
      accept: function(file, done) {
        return done();
      },
      init: function() {
        return noop;
      },
      forceFallback: false,
      fallback: function() {
        var child, messageElement, span, _i, _len, _ref;
        this.element.className = "" + this.element.className + " dz-browser-not-supported";
        _ref = this.element.getElementsByTagName("div");
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          if (/(^| )dz-message($| )/.test(child.className)) {
            messageElement = child;
            child.className = "dz-message";
            continue;
          }
        }
        if (!messageElement) {
          messageElement = Dropzone.createElement("<div class=\"dz-message\"><span></span></div>");
          this.element.appendChild(messageElement);
        }
        span = messageElement.getElementsByTagName("span")[0];
        if (span) {
          if (span.textContent != null) {
            span.textContent = this.options.dictFallbackMessage;
          } else if (span.innerText != null) {
            span.innerText = this.options.dictFallbackMessage;
          }
        }
        return this.element.appendChild(this.getFallbackForm());
      },
      resize: function(file) {
        var info, srcRatio, trgRatio;
        info = {
          srcX: 0,
          srcY: 0,
          srcWidth: file.width,
          srcHeight: file.height
        };
        srcRatio = file.width / file.height;
        info.optWidth = this.options.thumbnailWidth;
        info.optHeight = this.options.thumbnailHeight;
        if ((info.optWidth == null) && (info.optHeight == null)) {
          info.optWidth = info.srcWidth;
          info.optHeight = info.srcHeight;
        } else if (info.optWidth == null) {
          info.optWidth = srcRatio * info.optHeight;
        } else if (info.optHeight == null) {
          info.optHeight = (1 / srcRatio) * info.optWidth;
        }
        trgRatio = info.optWidth / info.optHeight;
        if (file.height < info.optHeight || file.width < info.optWidth) {
          info.trgHeight = info.srcHeight;
          info.trgWidth = info.srcWidth;
        } else {
          if (srcRatio > trgRatio) {
            info.srcHeight = file.height;
            info.srcWidth = info.srcHeight * trgRatio;
          } else {
            info.srcWidth = file.width;
            info.srcHeight = info.srcWidth / trgRatio;
          }
        }
        info.srcX = (file.width - info.srcWidth) / 2;
        info.srcY = (file.height - info.srcHeight) / 2;
        return info;
      },

      /*
      Those functions register themselves to the events on init and handle all
      the user interface specific stuff. Overwriting them won't break the upload
      but can break the way it's displayed.
      You can overwrite them if you don't like the default behavior. If you just
      want to add an additional event handler, register it on the dropzone object
      and don't overwrite those options.
       */
      drop: function(e) {
        return this.element.classList.remove("dz-drag-hover");
      },
      dragstart: noop,
      dragend: function(e) {
        return this.element.classList.remove("dz-drag-hover");
      },
      dragenter: function(e) {
        return this.element.classList.add("dz-drag-hover");
      },
      dragover: function(e) {
        return this.element.classList.add("dz-drag-hover");
      },
      dragleave: function(e) {
        return this.element.classList.remove("dz-drag-hover");
      },
      paste: noop,
      reset: function() {
        return this.element.classList.remove("dz-started");
      },
      addedfile: function(file) {
        var node, removeFileEvent, removeLink, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _results;
        if (this.element === this.previewsContainer) {
          this.element.classList.add("dz-started");
        }
        if (this.previewsContainer) {
          file.previewElement = Dropzone.createElement(this.options.previewTemplate.trim());
          file.previewTemplate = file.previewElement;
          this.previewsContainer.appendChild(file.previewElement);
          _ref = file.previewElement.querySelectorAll("[data-dz-name]");
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            node = _ref[_i];
            node.textContent = file.name;
          }
          _ref1 = file.previewElement.querySelectorAll("[data-dz-size]");
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            node = _ref1[_j];
            node.innerHTML = this.filesize(file.size);
          }
          if (this.options.addRemoveLinks) {
            file._removeLink = Dropzone.createElement("<a class=\"dz-remove\" href=\"javascript:undefined;\" data-dz-remove>" + this.options.dictRemoveFile + "</a>");
            file.previewElement.appendChild(file._removeLink);
          }
          removeFileEvent = (function(_this) {
            return function(e) {
              e.preventDefault();
              e.stopPropagation();
              if (file.status === Dropzone.UPLOADING) {
                return Dropzone.confirm(_this.options.dictCancelUploadConfirmation, function() {
                  return _this.removeFile(file);
                });
              } else {
                if (_this.options.dictRemoveFileConfirmation) {
                  return Dropzone.confirm(_this.options.dictRemoveFileConfirmation, function() {
                    return _this.removeFile(file);
                  });
                } else {
                  return _this.removeFile(file);
                }
              }
            };
          })(this);
          _ref2 = file.previewElement.querySelectorAll("[data-dz-remove]");
          _results = [];
          for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
            removeLink = _ref2[_k];
            _results.push(removeLink.addEventListener("click", removeFileEvent));
          }
          return _results;
        }
      },
      removedfile: function(file) {
        var _ref;
        if (file.previewElement) {
          if ((_ref = file.previewElement) != null) {
            _ref.parentNode.removeChild(file.previewElement);
          }
        }
        return this._updateMaxFilesReachedClass();
      },
      thumbnail: function(file, dataUrl) {
        var thumbnailElement, _i, _len, _ref;
        if (file.previewElement) {
          file.previewElement.classList.remove("dz-file-preview");
          _ref = file.previewElement.querySelectorAll("[data-dz-thumbnail]");
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            thumbnailElement = _ref[_i];
            thumbnailElement.alt = file.name;
            thumbnailElement.src = dataUrl;
          }
          return setTimeout(((function(_this) {
            return function() {
              return file.previewElement.classList.add("dz-image-preview");
            };
          })(this)), 1);
        }
      },
      error: function(file, message) {
        var node, _i, _len, _ref, _results;
        if (file.previewElement) {
          file.previewElement.classList.add("dz-error");
          if (typeof message !== "String" && message.error) {
            message = message.error;
          }
          _ref = file.previewElement.querySelectorAll("[data-dz-errormessage]");
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            node = _ref[_i];
            _results.push(node.textContent = message);
          }
          return _results;
        }
      },
      errormultiple: noop,
      processing: function(file) {
        if (file.previewElement) {
          file.previewElement.classList.add("dz-processing");
          if (file._removeLink) {
            return file._removeLink.textContent = this.options.dictCancelUpload;
          }
        }
      },
      processingmultiple: noop,
      uploadprogress: function(file, progress, bytesSent) {
        var node, _i, _len, _ref, _results;
        if (file.previewElement) {
          _ref = file.previewElement.querySelectorAll("[data-dz-uploadprogress]");
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            node = _ref[_i];
            if (node.nodeName === 'PROGRESS') {
              _results.push(node.value = progress);
            } else {
              _results.push(node.style.width = "" + progress + "%");
            }
          }
          return _results;
        }
      },
      totaluploadprogress: noop,
      sending: noop,
      sendingmultiple: noop,
      success: function(file) {
        if (file.previewElement) {
          return file.previewElement.classList.add("dz-success");
        }
      },
      successmultiple: noop,
      canceled: function(file) {
        return this.emit("error", file, "Upload canceled.");
      },
      canceledmultiple: noop,
      complete: function(file) {
        if (file._removeLink) {
          file._removeLink.textContent = this.options.dictRemoveFile;
        }
        if (file.previewElement) {
          return file.previewElement.classList.add("dz-complete");
        }
      },
      completemultiple: noop,
      maxfilesexceeded: noop,
      maxfilesreached: noop,
      queuecomplete: noop,
      addedfiles: noop,
      previewTemplate: "<div class=\"dz-preview dz-file-preview\">\n  <div class=\"dz-image\"><img data-dz-thumbnail /></div>\n  <div class=\"dz-details\">\n    <div class=\"dz-size\"><span data-dz-size></span></div>\n    <div class=\"dz-filename\"><span data-dz-name></span></div>\n  </div>\n  <div class=\"dz-progress\"><span class=\"dz-upload\" data-dz-uploadprogress></span></div>\n  <div class=\"dz-error-message\"><span data-dz-errormessage></span></div>\n  <div class=\"dz-success-mark\">\n    <svg width=\"54px\" height=\"54px\" viewBox=\"0 0 54 54\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:sketch=\"http://www.bohemiancoding.com/sketch/ns\">\n      <title>Check</title>\n      <defs></defs>\n      <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\" sketch:type=\"MSPage\">\n        <path d=\"M23.5,31.8431458 L17.5852419,25.9283877 C16.0248253,24.3679711 13.4910294,24.366835 11.9289322,25.9289322 C10.3700136,27.4878508 10.3665912,30.0234455 11.9283877,31.5852419 L20.4147581,40.0716123 C20.5133999,40.1702541 20.6159315,40.2626649 20.7218615,40.3488435 C22.2835669,41.8725651 24.794234,41.8626202 26.3461564,40.3106978 L43.3106978,23.3461564 C44.8771021,21.7797521 44.8758057,19.2483887 43.3137085,17.6862915 C41.7547899,16.1273729 39.2176035,16.1255422 37.6538436,17.6893022 L23.5,31.8431458 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z\" id=\"Oval-2\" stroke-opacity=\"0.198794158\" stroke=\"#747474\" fill-opacity=\"0.816519475\" fill=\"#FFFFFF\" sketch:type=\"MSShapeGroup\"></path>\n      </g>\n    </svg>\n  </div>\n  <div class=\"dz-error-mark\">\n    <svg width=\"54px\" height=\"54px\" viewBox=\"0 0 54 54\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:sketch=\"http://www.bohemiancoding.com/sketch/ns\">\n      <title>Error</title>\n      <defs></defs>\n      <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\" sketch:type=\"MSPage\">\n        <g id=\"Check-+-Oval-2\" sketch:type=\"MSLayerGroup\" stroke=\"#747474\" stroke-opacity=\"0.198794158\" fill=\"#FFFFFF\" fill-opacity=\"0.816519475\">\n          <path d=\"M32.6568542,29 L38.3106978,23.3461564 C39.8771021,21.7797521 39.8758057,19.2483887 38.3137085,17.6862915 C36.7547899,16.1273729 34.2176035,16.1255422 32.6538436,17.6893022 L27,23.3431458 L21.3461564,17.6893022 C19.7823965,16.1255422 17.2452101,16.1273729 15.6862915,17.6862915 C14.1241943,19.2483887 14.1228979,21.7797521 15.6893022,23.3461564 L21.3431458,29 L15.6893022,34.6538436 C14.1228979,36.2202479 14.1241943,38.7516113 15.6862915,40.3137085 C17.2452101,41.8726271 19.7823965,41.8744578 21.3461564,40.3106978 L27,34.6568542 L32.6538436,40.3106978 C34.2176035,41.8744578 36.7547899,41.8726271 38.3137085,40.3137085 C39.8758057,38.7516113 39.8771021,36.2202479 38.3106978,34.6538436 L32.6568542,29 Z M27,53 C41.3594035,53 53,41.3594035 53,27 C53,12.6405965 41.3594035,1 27,1 C12.6405965,1 1,12.6405965 1,27 C1,41.3594035 12.6405965,53 27,53 Z\" id=\"Oval-2\" sketch:type=\"MSShapeGroup\"></path>\n        </g>\n      </g>\n    </svg>\n  </div>\n</div>"
    };

    extend = function() {
      var key, object, objects, target, val, _i, _len;
      target = arguments[0], objects = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        object = objects[_i];
        for (key in object) {
          val = object[key];
          target[key] = val;
        }
      }
      return target;
    };

    function Dropzone(element, options) {
      var elementOptions, fallback, _ref;
      this.element = element;
      this.version = Dropzone.version;
      this.defaultOptions.previewTemplate = this.defaultOptions.previewTemplate.replace(/\n*/g, "");
      this.clickableElements = [];
      this.listeners = [];
      this.files = [];
      if (typeof this.element === "string") {
        this.element = document.querySelector(this.element);
      }
      if (!(this.element && (this.element.nodeType != null))) {
        throw new Error("Invalid dropzone element.");
      }
      if (this.element.dropzone) {
        throw new Error("Dropzone already attached.");
      }
      Dropzone.instances.push(this);
      this.element.dropzone = this;
      elementOptions = (_ref = Dropzone.optionsForElement(this.element)) != null ? _ref : {};
      this.options = extend({}, this.defaultOptions, elementOptions, options != null ? options : {});
      if (this.options.forceFallback || !Dropzone.isBrowserSupported()) {
        return this.options.fallback.call(this);
      }
      if (this.options.url == null) {
        this.options.url = this.element.getAttribute("action");
      }
      if (!this.options.url) {
        throw new Error("No URL provided.");
      }
      if (this.options.acceptedFiles && this.options.acceptedMimeTypes) {
        throw new Error("You can't provide both 'acceptedFiles' and 'acceptedMimeTypes'. 'acceptedMimeTypes' is deprecated.");
      }
      if (this.options.acceptedMimeTypes) {
        this.options.acceptedFiles = this.options.acceptedMimeTypes;
        delete this.options.acceptedMimeTypes;
      }
      this.options.method = this.options.method.toUpperCase();
      if ((fallback = this.getExistingFallback()) && fallback.parentNode) {
        fallback.parentNode.removeChild(fallback);
      }
      if (this.options.previewsContainer !== false) {
        if (this.options.previewsContainer) {
          this.previewsContainer = Dropzone.getElement(this.options.previewsContainer, "previewsContainer");
        } else {
          this.previewsContainer = this.element;
        }
      }
      if (this.options.clickable) {
        if (this.options.clickable === true) {
          this.clickableElements = [this.element];
        } else {
          this.clickableElements = Dropzone.getElements(this.options.clickable, "clickable");
        }
      }
      this.init();
    }

    Dropzone.prototype.getAcceptedFiles = function() {
      var file, _i, _len, _ref, _results;
      _ref = this.files;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        if (file.accepted) {
          _results.push(file);
        }
      }
      return _results;
    };

    Dropzone.prototype.getRejectedFiles = function() {
      var file, _i, _len, _ref, _results;
      _ref = this.files;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        if (!file.accepted) {
          _results.push(file);
        }
      }
      return _results;
    };

    Dropzone.prototype.getFilesWithStatus = function(status) {
      var file, _i, _len, _ref, _results;
      _ref = this.files;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        if (file.status === status) {
          _results.push(file);
        }
      }
      return _results;
    };

    Dropzone.prototype.getQueuedFiles = function() {
      return this.getFilesWithStatus(Dropzone.QUEUED);
    };

    Dropzone.prototype.getUploadingFiles = function() {
      return this.getFilesWithStatus(Dropzone.UPLOADING);
    };

    Dropzone.prototype.getAddedFiles = function() {
      return this.getFilesWithStatus(Dropzone.ADDED);
    };

    Dropzone.prototype.getActiveFiles = function() {
      var file, _i, _len, _ref, _results;
      _ref = this.files;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        if (file.status === Dropzone.UPLOADING || file.status === Dropzone.QUEUED) {
          _results.push(file);
        }
      }
      return _results;
    };

    Dropzone.prototype.init = function() {
      var eventName, noPropagation, setupHiddenFileInput, _i, _len, _ref, _ref1;
      if (this.element.tagName === "form") {
        this.element.setAttribute("enctype", "multipart/form-data");
      }
      if (this.element.classList.contains("dropzone") && !this.element.querySelector(".dz-message")) {
        this.element.appendChild(Dropzone.createElement("<div class=\"dz-default dz-message\"><span>" + this.options.dictDefaultMessage + "</span></div>"));
      }
      if (this.clickableElements.length) {
        setupHiddenFileInput = (function(_this) {
          return function() {
            if (_this.hiddenFileInput) {
              _this.hiddenFileInput.parentNode.removeChild(_this.hiddenFileInput);
            }
            _this.hiddenFileInput = document.createElement("input");
            _this.hiddenFileInput.setAttribute("type", "file");
            if ((_this.options.maxFiles == null) || _this.options.maxFiles > 1) {
              _this.hiddenFileInput.setAttribute("multiple", "multiple");
            }
            _this.hiddenFileInput.className = "dz-hidden-input";
            if (_this.options.acceptedFiles != null) {
              _this.hiddenFileInput.setAttribute("accept", _this.options.acceptedFiles);
            }
            if (_this.options.capture != null) {
              _this.hiddenFileInput.setAttribute("capture", _this.options.capture);
            }
            _this.hiddenFileInput.style.visibility = "hidden";
            _this.hiddenFileInput.style.position = "absolute";
            _this.hiddenFileInput.style.top = "0";
            _this.hiddenFileInput.style.left = "0";
            _this.hiddenFileInput.style.height = "0";
            _this.hiddenFileInput.style.width = "0";
            document.querySelector(_this.options.hiddenInputContainer).appendChild(_this.hiddenFileInput);
            return _this.hiddenFileInput.addEventListener("change", function() {
              var file, files, _i, _len;
              files = _this.hiddenFileInput.files;
              if (files.length) {
                for (_i = 0, _len = files.length; _i < _len; _i++) {
                  file = files[_i];
                  _this.addFile(file);
                }
              }
              _this.emit("addedfiles", files);
              return setupHiddenFileInput();
            });
          };
        })(this);
        setupHiddenFileInput();
      }
      this.URL = (_ref = window.URL) != null ? _ref : window.webkitURL;
      _ref1 = this.events;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        eventName = _ref1[_i];
        this.on(eventName, this.options[eventName]);
      }
      this.on("uploadprogress", (function(_this) {
        return function() {
          return _this.updateTotalUploadProgress();
        };
      })(this));
      this.on("removedfile", (function(_this) {
        return function() {
          return _this.updateTotalUploadProgress();
        };
      })(this));
      this.on("canceled", (function(_this) {
        return function(file) {
          return _this.emit("complete", file);
        };
      })(this));
      this.on("complete", (function(_this) {
        return function(file) {
          if (_this.getAddedFiles().length === 0 && _this.getUploadingFiles().length === 0 && _this.getQueuedFiles().length === 0) {
            return setTimeout((function() {
              return _this.emit("queuecomplete");
            }), 0);
          }
        };
      })(this));
      noPropagation = function(e) {
        e.stopPropagation();
        if (e.preventDefault) {
          return e.preventDefault();
        } else {
          return e.returnValue = false;
        }
      };
      this.listeners = [
        {
          element: this.element,
          events: {
            "dragstart": (function(_this) {
              return function(e) {
                return _this.emit("dragstart", e);
              };
            })(this),
            "dragenter": (function(_this) {
              return function(e) {
                noPropagation(e);
                return _this.emit("dragenter", e);
              };
            })(this),
            "dragover": (function(_this) {
              return function(e) {
                var efct;
                try {
                  efct = e.dataTransfer.effectAllowed;
                } catch (_error) {}
                e.dataTransfer.dropEffect = 'move' === efct || 'linkMove' === efct ? 'move' : 'copy';
                noPropagation(e);
                return _this.emit("dragover", e);
              };
            })(this),
            "dragleave": (function(_this) {
              return function(e) {
                return _this.emit("dragleave", e);
              };
            })(this),
            "drop": (function(_this) {
              return function(e) {
                noPropagation(e);
                return _this.drop(e);
              };
            })(this),
            "dragend": (function(_this) {
              return function(e) {
                return _this.emit("dragend", e);
              };
            })(this)
          }
        }
      ];
      this.clickableElements.forEach((function(_this) {
        return function(clickableElement) {
          return _this.listeners.push({
            element: clickableElement,
            events: {
              "click": function(evt) {
                if ((clickableElement !== _this.element) || (evt.target === _this.element || Dropzone.elementInside(evt.target, _this.element.querySelector(".dz-message")))) {
                  _this.hiddenFileInput.click();
                }
                return true;
              }
            }
          });
        };
      })(this));
      this.enable();
      return this.options.init.call(this);
    };

    Dropzone.prototype.destroy = function() {
      var _ref;
      this.disable();
      this.removeAllFiles(true);
      if ((_ref = this.hiddenFileInput) != null ? _ref.parentNode : void 0) {
        this.hiddenFileInput.parentNode.removeChild(this.hiddenFileInput);
        this.hiddenFileInput = null;
      }
      delete this.element.dropzone;
      return Dropzone.instances.splice(Dropzone.instances.indexOf(this), 1);
    };

    Dropzone.prototype.updateTotalUploadProgress = function() {
      var activeFiles, file, totalBytes, totalBytesSent, totalUploadProgress, _i, _len, _ref;
      totalBytesSent = 0;
      totalBytes = 0;
      activeFiles = this.getActiveFiles();
      if (activeFiles.length) {
        _ref = this.getActiveFiles();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          totalBytesSent += file.upload.bytesSent;
          totalBytes += file.upload.total;
        }
        totalUploadProgress = 100 * totalBytesSent / totalBytes;
      } else {
        totalUploadProgress = 100;
      }
      return this.emit("totaluploadprogress", totalUploadProgress, totalBytes, totalBytesSent);
    };

    Dropzone.prototype._getParamName = function(n) {
      if (typeof this.options.paramName === "function") {
        return this.options.paramName(n);
      } else {
        return "" + this.options.paramName + (this.options.uploadMultiple ? "[" + n + "]" : "");
      }
    };

    Dropzone.prototype.getFallbackForm = function() {
      var existingFallback, fields, fieldsString, form;
      if (existingFallback = this.getExistingFallback()) {
        return existingFallback;
      }
      fieldsString = "<div class=\"dz-fallback\">";
      if (this.options.dictFallbackText) {
        fieldsString += "<p>" + this.options.dictFallbackText + "</p>";
      }
      fieldsString += "<input type=\"file\" name=\"" + (this._getParamName(0)) + "\" " + (this.options.uploadMultiple ? 'multiple="multiple"' : void 0) + " /><input type=\"submit\" value=\"Upload!\"></div>";
      fields = Dropzone.createElement(fieldsString);
      if (this.element.tagName !== "FORM") {
        form = Dropzone.createElement("<form action=\"" + this.options.url + "\" enctype=\"multipart/form-data\" method=\"" + this.options.method + "\"></form>");
        form.appendChild(fields);
      } else {
        this.element.setAttribute("enctype", "multipart/form-data");
        this.element.setAttribute("method", this.options.method);
      }
      return form != null ? form : fields;
    };

    Dropzone.prototype.getExistingFallback = function() {
      var fallback, getFallback, tagName, _i, _len, _ref;
      getFallback = function(elements) {
        var el, _i, _len;
        for (_i = 0, _len = elements.length; _i < _len; _i++) {
          el = elements[_i];
          if (/(^| )fallback($| )/.test(el.className)) {
            return el;
          }
        }
      };
      _ref = ["div", "form"];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tagName = _ref[_i];
        if (fallback = getFallback(this.element.getElementsByTagName(tagName))) {
          return fallback;
        }
      }
    };

    Dropzone.prototype.setupEventListeners = function() {
      var elementListeners, event, listener, _i, _len, _ref, _results;
      _ref = this.listeners;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elementListeners = _ref[_i];
        _results.push((function() {
          var _ref1, _results1;
          _ref1 = elementListeners.events;
          _results1 = [];
          for (event in _ref1) {
            listener = _ref1[event];
            _results1.push(elementListeners.element.addEventListener(event, listener, false));
          }
          return _results1;
        })());
      }
      return _results;
    };

    Dropzone.prototype.removeEventListeners = function() {
      var elementListeners, event, listener, _i, _len, _ref, _results;
      _ref = this.listeners;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elementListeners = _ref[_i];
        _results.push((function() {
          var _ref1, _results1;
          _ref1 = elementListeners.events;
          _results1 = [];
          for (event in _ref1) {
            listener = _ref1[event];
            _results1.push(elementListeners.element.removeEventListener(event, listener, false));
          }
          return _results1;
        })());
      }
      return _results;
    };

    Dropzone.prototype.disable = function() {
      var file, _i, _len, _ref, _results;
      this.clickableElements.forEach(function(element) {
        return element.classList.remove("dz-clickable");
      });
      this.removeEventListeners();
      _ref = this.files;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        _results.push(this.cancelUpload(file));
      }
      return _results;
    };

    Dropzone.prototype.enable = function() {
      this.clickableElements.forEach(function(element) {
        return element.classList.add("dz-clickable");
      });
      return this.setupEventListeners();
    };

    Dropzone.prototype.filesize = function(size) {
      var cutoff, i, selectedSize, selectedUnit, unit, units, _i, _len;
      selectedSize = 0;
      selectedUnit = "b";
      if (size > 0) {
        units = ['TB', 'GB', 'MB', 'KB', 'b'];
        for (i = _i = 0, _len = units.length; _i < _len; i = ++_i) {
          unit = units[i];
          cutoff = Math.pow(this.options.filesizeBase, 4 - i) / 10;
          if (size >= cutoff) {
            selectedSize = size / Math.pow(this.options.filesizeBase, 4 - i);
            selectedUnit = unit;
            break;
          }
        }
        selectedSize = Math.round(10 * selectedSize) / 10;
      }
      return "<strong>" + selectedSize + "</strong> " + selectedUnit;
    };

    Dropzone.prototype._updateMaxFilesReachedClass = function() {
      if ((this.options.maxFiles != null) && this.getAcceptedFiles().length >= this.options.maxFiles) {
        if (this.getAcceptedFiles().length === this.options.maxFiles) {
          this.emit('maxfilesreached', this.files);
        }
        return this.element.classList.add("dz-max-files-reached");
      } else {
        return this.element.classList.remove("dz-max-files-reached");
      }
    };

    Dropzone.prototype.drop = function(e) {
      var files, items;
      if (!e.dataTransfer) {
        return;
      }
      this.emit("drop", e);
      files = e.dataTransfer.files;
      this.emit("addedfiles", files);
      if (files.length) {
        items = e.dataTransfer.items;
        if (items && items.length && (items[0].webkitGetAsEntry != null)) {
          this._addFilesFromItems(items);
        } else {
          this.handleFiles(files);
        }
      }
    };

    Dropzone.prototype.paste = function(e) {
      var items, _ref;
      if ((e != null ? (_ref = e.clipboardData) != null ? _ref.items : void 0 : void 0) == null) {
        return;
      }
      this.emit("paste", e);
      items = e.clipboardData.items;
      if (items.length) {
        return this._addFilesFromItems(items);
      }
    };

    Dropzone.prototype.handleFiles = function(files) {
      var file, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        _results.push(this.addFile(file));
      }
      return _results;
    };

    Dropzone.prototype._addFilesFromItems = function(items) {
      var entry, item, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        if ((item.webkitGetAsEntry != null) && (entry = item.webkitGetAsEntry())) {
          if (entry.isFile) {
            _results.push(this.addFile(item.getAsFile()));
          } else if (entry.isDirectory) {
            _results.push(this._addFilesFromDirectory(entry, entry.name));
          } else {
            _results.push(void 0);
          }
        } else if (item.getAsFile != null) {
          if ((item.kind == null) || item.kind === "file") {
            _results.push(this.addFile(item.getAsFile()));
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Dropzone.prototype._addFilesFromDirectory = function(directory, path) {
      var dirReader, entriesReader;
      dirReader = directory.createReader();
      entriesReader = (function(_this) {
        return function(entries) {
          var entry, _i, _len;
          for (_i = 0, _len = entries.length; _i < _len; _i++) {
            entry = entries[_i];
            if (entry.isFile) {
              entry.file(function(file) {
                if (_this.options.ignoreHiddenFiles && file.name.substring(0, 1) === '.') {
                  return;
                }
                file.fullPath = "" + path + "/" + file.name;
                return _this.addFile(file);
              });
            } else if (entry.isDirectory) {
              _this._addFilesFromDirectory(entry, "" + path + "/" + entry.name);
            }
          }
        };
      })(this);
      return dirReader.readEntries(entriesReader, function(error) {
        return typeof console !== "undefined" && console !== null ? typeof console.log === "function" ? console.log(error) : void 0 : void 0;
      });
    };

    Dropzone.prototype.accept = function(file, done) {
      if (file.size > this.options.maxFilesize * 1024 * 1024) {
        return done(this.options.dictFileTooBig.replace("{{filesize}}", Math.round(file.size / 1024 / 10.24) / 100).replace("{{maxFilesize}}", this.options.maxFilesize));
      } else if (!Dropzone.isValidFile(file, this.options.acceptedFiles)) {
        return done(this.options.dictInvalidFileType);
      } else if ((this.options.maxFiles != null) && this.getAcceptedFiles().length >= this.options.maxFiles) {
        done(this.options.dictMaxFilesExceeded.replace("{{maxFiles}}", this.options.maxFiles));
        return this.emit("maxfilesexceeded", file);
      } else {
        return this.options.accept.call(this, file, done);
      }
    };

    Dropzone.prototype.addFile = function(file) {
      file.upload = {
        progress: 0,
        total: file.size,
        bytesSent: 0
      };
      this.files.push(file);
      file.status = Dropzone.ADDED;
      this.emit("addedfile", file);
      this._enqueueThumbnail(file);
      return this.accept(file, (function(_this) {
        return function(error) {
          if (error) {
            file.accepted = false;
            _this._errorProcessing([file], error);
          } else {
            file.accepted = true;
            if (_this.options.autoQueue) {
              _this.enqueueFile(file);
            }
          }
          return _this._updateMaxFilesReachedClass();
        };
      })(this));
    };

    Dropzone.prototype.enqueueFiles = function(files) {
      var file, _i, _len;
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        this.enqueueFile(file);
      }
      return null;
    };

    Dropzone.prototype.enqueueFile = function(file) {
      if (file.status === Dropzone.ADDED && file.accepted === true) {
        file.status = Dropzone.QUEUED;
        if (this.options.autoProcessQueue) {
          return setTimeout(((function(_this) {
            return function() {
              return _this.processQueue();
            };
          })(this)), 0);
        }
      } else {
        throw new Error("This file can't be queued because it has already been processed or was rejected.");
      }
    };

    Dropzone.prototype._thumbnailQueue = [];

    Dropzone.prototype._processingThumbnail = false;

    Dropzone.prototype._enqueueThumbnail = function(file) {
      if (this.options.createImageThumbnails && file.type.match(/image.*/) && file.size <= this.options.maxThumbnailFilesize * 1024 * 1024) {
        this._thumbnailQueue.push(file);
        return setTimeout(((function(_this) {
          return function() {
            return _this._processThumbnailQueue();
          };
        })(this)), 0);
      }
    };

    Dropzone.prototype._processThumbnailQueue = function() {
      if (this._processingThumbnail || this._thumbnailQueue.length === 0) {
        return;
      }
      this._processingThumbnail = true;
      return this.createThumbnail(this._thumbnailQueue.shift(), (function(_this) {
        return function() {
          _this._processingThumbnail = false;
          return _this._processThumbnailQueue();
        };
      })(this));
    };

    Dropzone.prototype.removeFile = function(file) {
      if (file.status === Dropzone.UPLOADING) {
        this.cancelUpload(file);
      }
      this.files = without(this.files, file);
      this.emit("removedfile", file);
      if (this.files.length === 0) {
        return this.emit("reset");
      }
    };

    Dropzone.prototype.removeAllFiles = function(cancelIfNecessary) {
      var file, _i, _len, _ref;
      if (cancelIfNecessary == null) {
        cancelIfNecessary = false;
      }
      _ref = this.files.slice();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        file = _ref[_i];
        if (file.status !== Dropzone.UPLOADING || cancelIfNecessary) {
          this.removeFile(file);
        }
      }
      return null;
    };

    Dropzone.prototype.createThumbnail = function(file, callback) {
      var fileReader;
      fileReader = new FileReader;
      fileReader.onload = (function(_this) {
        return function() {
          if (file.type === "image/svg+xml") {
            _this.emit("thumbnail", file, fileReader.result);
            if (callback != null) {
              callback();
            }
            return;
          }
          return _this.createThumbnailFromUrl(file, fileReader.result, callback);
        };
      })(this);
      return fileReader.readAsDataURL(file);
    };

    Dropzone.prototype.createThumbnailFromUrl = function(file, imageUrl, callback, crossOrigin) {
      var img;
      img = document.createElement("img");
      if (crossOrigin) {
        img.crossOrigin = crossOrigin;
      }
      img.onload = (function(_this) {
        return function() {
          var canvas, ctx, resizeInfo, thumbnail, _ref, _ref1, _ref2, _ref3;
          file.width = img.width;
          file.height = img.height;
          resizeInfo = _this.options.resize.call(_this, file);
          if (resizeInfo.trgWidth == null) {
            resizeInfo.trgWidth = resizeInfo.optWidth;
          }
          if (resizeInfo.trgHeight == null) {
            resizeInfo.trgHeight = resizeInfo.optHeight;
          }
          canvas = document.createElement("canvas");
          ctx = canvas.getContext("2d");
          canvas.width = resizeInfo.trgWidth;
          canvas.height = resizeInfo.trgHeight;
          drawImageIOSFix(ctx, img, (_ref = resizeInfo.srcX) != null ? _ref : 0, (_ref1 = resizeInfo.srcY) != null ? _ref1 : 0, resizeInfo.srcWidth, resizeInfo.srcHeight, (_ref2 = resizeInfo.trgX) != null ? _ref2 : 0, (_ref3 = resizeInfo.trgY) != null ? _ref3 : 0, resizeInfo.trgWidth, resizeInfo.trgHeight);
          thumbnail = canvas.toDataURL("image/png");
          _this.emit("thumbnail", file, thumbnail);
          if (callback != null) {
            return callback();
          }
        };
      })(this);
      if (callback != null) {
        img.onerror = callback;
      }
      return img.src = imageUrl;
    };

    Dropzone.prototype.processQueue = function() {
      var i, parallelUploads, processingLength, queuedFiles;
      parallelUploads = this.options.parallelUploads;
      processingLength = this.getUploadingFiles().length;
      i = processingLength;
      if (processingLength >= parallelUploads) {
        return;
      }
      queuedFiles = this.getQueuedFiles();
      if (!(queuedFiles.length > 0)) {
        return;
      }
      if (this.options.uploadMultiple) {
        return this.processFiles(queuedFiles.slice(0, parallelUploads - processingLength));
      } else {
        while (i < parallelUploads) {
          if (!queuedFiles.length) {
            return;
          }
          this.processFile(queuedFiles.shift());
          i++;
        }
      }
    };

    Dropzone.prototype.processFile = function(file) {
      return this.processFiles([file]);
    };

    Dropzone.prototype.processFiles = function(files) {
      var file, _i, _len;
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        file.processing = true;
        file.status = Dropzone.UPLOADING;
        this.emit("processing", file);
      }
      if (this.options.uploadMultiple) {
        this.emit("processingmultiple", files);
      }
      return this.uploadFiles(files);
    };

    Dropzone.prototype._getFilesWithXhr = function(xhr) {
      var file, files;
      return files = (function() {
        var _i, _len, _ref, _results;
        _ref = this.files;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          file = _ref[_i];
          if (file.xhr === xhr) {
            _results.push(file);
          }
        }
        return _results;
      }).call(this);
    };

    Dropzone.prototype.cancelUpload = function(file) {
      var groupedFile, groupedFiles, _i, _j, _len, _len1, _ref;
      if (file.status === Dropzone.UPLOADING) {
        groupedFiles = this._getFilesWithXhr(file.xhr);
        for (_i = 0, _len = groupedFiles.length; _i < _len; _i++) {
          groupedFile = groupedFiles[_i];
          groupedFile.status = Dropzone.CANCELED;
        }
        file.xhr.abort();
        for (_j = 0, _len1 = groupedFiles.length; _j < _len1; _j++) {
          groupedFile = groupedFiles[_j];
          this.emit("canceled", groupedFile);
        }
        if (this.options.uploadMultiple) {
          this.emit("canceledmultiple", groupedFiles);
        }
      } else if ((_ref = file.status) === Dropzone.ADDED || _ref === Dropzone.QUEUED) {
        file.status = Dropzone.CANCELED;
        this.emit("canceled", file);
        if (this.options.uploadMultiple) {
          this.emit("canceledmultiple", [file]);
        }
      }
      if (this.options.autoProcessQueue) {
        return this.processQueue();
      }
    };

    resolveOption = function() {
      var args, option;
      option = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (typeof option === 'function') {
        return option.apply(this, args);
      }
      return option;
    };

    Dropzone.prototype.uploadFile = function(file) {
      return this.uploadFiles([file]);
    };

    Dropzone.prototype.uploadFiles = function(files) {
      var file, formData, handleError, headerName, headerValue, headers, i, input, inputName, inputType, key, method, option, progressObj, response, updateProgress, url, value, xhr, _i, _j, _k, _l, _len, _len1, _len2, _len3, _m, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
      xhr = new XMLHttpRequest();
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        file.xhr = xhr;
      }
      method = resolveOption(this.options.method, files);
      url = resolveOption(this.options.url, files);
      xhr.open(method, url, true);
      xhr.withCredentials = !!this.options.withCredentials;
      response = null;
      handleError = (function(_this) {
        return function() {
          var _j, _len1, _results;
          _results = [];
          for (_j = 0, _len1 = files.length; _j < _len1; _j++) {
            file = files[_j];
            _results.push(_this._errorProcessing(files, response || _this.options.dictResponseError.replace("{{statusCode}}", xhr.status), xhr));
          }
          return _results;
        };
      })(this);
      updateProgress = (function(_this) {
        return function(e) {
          var allFilesFinished, progress, _j, _k, _l, _len1, _len2, _len3, _results;
          if (e != null) {
            progress = 100 * e.loaded / e.total;
            for (_j = 0, _len1 = files.length; _j < _len1; _j++) {
              file = files[_j];
              file.upload = {
                progress: progress,
                total: e.total,
                bytesSent: e.loaded
              };
            }
          } else {
            allFilesFinished = true;
            progress = 100;
            for (_k = 0, _len2 = files.length; _k < _len2; _k++) {
              file = files[_k];
              if (!(file.upload.progress === 100 && file.upload.bytesSent === file.upload.total)) {
                allFilesFinished = false;
              }
              file.upload.progress = progress;
              file.upload.bytesSent = file.upload.total;
            }
            if (allFilesFinished) {
              return;
            }
          }
          _results = [];
          for (_l = 0, _len3 = files.length; _l < _len3; _l++) {
            file = files[_l];
            _results.push(_this.emit("uploadprogress", file, progress, file.upload.bytesSent));
          }
          return _results;
        };
      })(this);
      xhr.onload = (function(_this) {
        return function(e) {
          var _ref;
          if (files[0].status === Dropzone.CANCELED) {
            return;
          }
          if (xhr.readyState !== 4) {
            return;
          }
          response = xhr.responseText;
          if (xhr.getResponseHeader("content-type") && ~xhr.getResponseHeader("content-type").indexOf("application/json")) {
            try {
              response = JSON.parse(response);
            } catch (_error) {
              e = _error;
              response = "Invalid JSON response from server.";
            }
          }
          updateProgress();
          if (!((200 <= (_ref = xhr.status) && _ref < 300))) {
            return handleError();
          } else {
            return _this._finished(files, response, e);
          }
        };
      })(this);
      xhr.onerror = (function(_this) {
        return function() {
          if (files[0].status === Dropzone.CANCELED) {
            return;
          }
          return handleError();
        };
      })(this);
      progressObj = (_ref = xhr.upload) != null ? _ref : xhr;
      progressObj.onprogress = updateProgress;
      headers = {
        "Accept": "application/json",
        "Cache-Control": "no-cache",
        "X-Requested-With": "XMLHttpRequest"
      };
      if (this.options.headers) {
        extend(headers, this.options.headers);
      }
      for (headerName in headers) {
        headerValue = headers[headerName];
        if (headerValue) {
          xhr.setRequestHeader(headerName, headerValue);
        }
      }
      formData = new FormData();
      if (this.options.params) {
        _ref1 = this.options.params;
        for (key in _ref1) {
          value = _ref1[key];
          formData.append(key, value);
        }
      }
      for (_j = 0, _len1 = files.length; _j < _len1; _j++) {
        file = files[_j];
        this.emit("sending", file, xhr, formData);
      }
      if (this.options.uploadMultiple) {
        this.emit("sendingmultiple", files, xhr, formData);
      }
      if (this.element.tagName === "FORM") {
        _ref2 = this.element.querySelectorAll("input, textarea, select, button");
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          input = _ref2[_k];
          inputName = input.getAttribute("name");
          inputType = input.getAttribute("type");
          if (input.tagName === "SELECT" && input.hasAttribute("multiple")) {
            _ref3 = input.options;
            for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
              option = _ref3[_l];
              if (option.selected) {
                formData.append(inputName, option.value);
              }
            }
          } else if (!inputType || ((_ref4 = inputType.toLowerCase()) !== "checkbox" && _ref4 !== "radio") || input.checked) {
            formData.append(inputName, input.value);
          }
        }
      }
      for (i = _m = 0, _ref5 = files.length - 1; 0 <= _ref5 ? _m <= _ref5 : _m >= _ref5; i = 0 <= _ref5 ? ++_m : --_m) {
        formData.append(this._getParamName(i), files[i], files[i].name);
      }
      return this.submitRequest(xhr, formData, files);
    };

    Dropzone.prototype.submitRequest = function(xhr, formData, files) {
      return xhr.send(formData);
    };

    Dropzone.prototype._finished = function(files, responseText, e) {
      var file, _i, _len;
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        file.status = Dropzone.SUCCESS;
        this.emit("success", file, responseText, e);
        this.emit("complete", file);
      }
      if (this.options.uploadMultiple) {
        this.emit("successmultiple", files, responseText, e);
        this.emit("completemultiple", files);
      }
      if (this.options.autoProcessQueue) {
        return this.processQueue();
      }
    };

    Dropzone.prototype._errorProcessing = function(files, message, xhr) {
      var file, _i, _len;
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        file.status = Dropzone.ERROR;
        this.emit("error", file, message, xhr);
        this.emit("complete", file);
      }
      if (this.options.uploadMultiple) {
        this.emit("errormultiple", files, message, xhr);
        this.emit("completemultiple", files);
      }
      if (this.options.autoProcessQueue) {
        return this.processQueue();
      }
    };

    return Dropzone;

  })(Emitter);

  Dropzone.version = "4.2.0";

  Dropzone.options = {};

  Dropzone.optionsForElement = function(element) {
    if (element.getAttribute("id")) {
      return Dropzone.options[camelize(element.getAttribute("id"))];
    } else {
      return void 0;
    }
  };

  Dropzone.instances = [];

  Dropzone.forElement = function(element) {
    if (typeof element === "string") {
      element = document.querySelector(element);
    }
    if ((element != null ? element.dropzone : void 0) == null) {
      throw new Error("No Dropzone found for given element. This is probably because you're trying to access it before Dropzone had the time to initialize. Use the `init` option to setup any additional observers on your Dropzone.");
    }
    return element.dropzone;
  };

  Dropzone.autoDiscover = true;

  Dropzone.discover = function() {
    var checkElements, dropzone, dropzones, _i, _len, _results;
    if (document.querySelectorAll) {
      dropzones = document.querySelectorAll(".dropzone");
    } else {
      dropzones = [];
      checkElements = function(elements) {
        var el, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = elements.length; _i < _len; _i++) {
          el = elements[_i];
          if (/(^| )dropzone($| )/.test(el.className)) {
            _results.push(dropzones.push(el));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };
      checkElements(document.getElementsByTagName("div"));
      checkElements(document.getElementsByTagName("form"));
    }
    _results = [];
    for (_i = 0, _len = dropzones.length; _i < _len; _i++) {
      dropzone = dropzones[_i];
      if (Dropzone.optionsForElement(dropzone) !== false) {
        _results.push(new Dropzone(dropzone));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Dropzone.blacklistedBrowsers = [/opera.*Macintosh.*version\/12/i];

  Dropzone.isBrowserSupported = function() {
    var capableBrowser, regex, _i, _len, _ref;
    capableBrowser = true;
    if (window.File && window.FileReader && window.FileList && window.Blob && window.FormData && document.querySelector) {
      if (!("classList" in document.createElement("a"))) {
        capableBrowser = false;
      } else {
        _ref = Dropzone.blacklistedBrowsers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          regex = _ref[_i];
          if (regex.test(navigator.userAgent)) {
            capableBrowser = false;
            continue;
          }
        }
      }
    } else {
      capableBrowser = false;
    }
    return capableBrowser;
  };

  without = function(list, rejectedItem) {
    var item, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = list.length; _i < _len; _i++) {
      item = list[_i];
      if (item !== rejectedItem) {
        _results.push(item);
      }
    }
    return _results;
  };

  camelize = function(str) {
    return str.replace(/[\-_](\w)/g, function(match) {
      return match.charAt(1).toUpperCase();
    });
  };

  Dropzone.createElement = function(string) {
    var div;
    div = document.createElement("div");
    div.innerHTML = string;
    return div.childNodes[0];
  };

  Dropzone.elementInside = function(element, container) {
    if (element === container) {
      return true;
    }
    while (element = element.parentNode) {
      if (element === container) {
        return true;
      }
    }
    return false;
  };

  Dropzone.getElement = function(el, name) {
    var element;
    if (typeof el === "string") {
      element = document.querySelector(el);
    } else if (el.nodeType != null) {
      element = el;
    }
    if (element == null) {
      throw new Error("Invalid `" + name + "` option provided. Please provide a CSS selector or a plain HTML element.");
    }
    return element;
  };

  Dropzone.getElements = function(els, name) {
    var e, el, elements, _i, _j, _len, _len1, _ref;
    if (els instanceof Array) {
      elements = [];
      try {
        for (_i = 0, _len = els.length; _i < _len; _i++) {
          el = els[_i];
          elements.push(this.getElement(el, name));
        }
      } catch (_error) {
        e = _error;
        elements = null;
      }
    } else if (typeof els === "string") {
      elements = [];
      _ref = document.querySelectorAll(els);
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        el = _ref[_j];
        elements.push(el);
      }
    } else if (els.nodeType != null) {
      elements = [els];
    }
    if (!((elements != null) && elements.length)) {
      throw new Error("Invalid `" + name + "` option provided. Please provide a CSS selector, a plain HTML element or a list of those.");
    }
    return elements;
  };

  Dropzone.confirm = function(question, accepted, rejected) {
    if (window.confirm(question)) {
      return accepted();
    } else if (rejected != null) {
      return rejected();
    }
  };

  Dropzone.isValidFile = function(file, acceptedFiles) {
    var baseMimeType, mimeType, validType, _i, _len;
    if (!acceptedFiles) {
      return true;
    }
    acceptedFiles = acceptedFiles.split(",");
    mimeType = file.type;
    baseMimeType = mimeType.replace(/\/.*$/, "");
    for (_i = 0, _len = acceptedFiles.length; _i < _len; _i++) {
      validType = acceptedFiles[_i];
      validType = validType.trim();
      if (validType.charAt(0) === ".") {
        if (file.name.toLowerCase().indexOf(validType.toLowerCase(), file.name.length - validType.length) !== -1) {
          return true;
        }
      } else if (/\/\*$/.test(validType)) {
        if (baseMimeType === validType.replace(/\/.*$/, "")) {
          return true;
        }
      } else {
        if (mimeType === validType) {
          return true;
        }
      }
    }
    return false;
  };

  if (typeof jQuery !== "undefined" && jQuery !== null) {
    jQuery.fn.dropzone = function(options) {
      return this.each(function() {
        return new Dropzone(this, options);
      });
    };
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = Dropzone;
  } else {
    window.Dropzone = Dropzone;
  }

  Dropzone.ADDED = "added";

  Dropzone.QUEUED = "queued";

  Dropzone.ACCEPTED = Dropzone.QUEUED;

  Dropzone.UPLOADING = "uploading";

  Dropzone.PROCESSING = Dropzone.UPLOADING;

  Dropzone.CANCELED = "canceled";

  Dropzone.ERROR = "error";

  Dropzone.SUCCESS = "success";


  /*
  
  Bugfix for iOS 6 and 7
  Source: http://stackoverflow.com/questions/11929099/html5-canvas-drawimage-ratio-bug-ios
  based on the work of https://github.com/stomita/ios-imagefile-megapixel
   */

  detectVerticalSquash = function(img) {
    var alpha, canvas, ctx, data, ey, ih, iw, py, ratio, sy;
    iw = img.naturalWidth;
    ih = img.naturalHeight;
    canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = ih;
    ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    data = ctx.getImageData(0, 0, 1, ih).data;
    sy = 0;
    ey = ih;
    py = ih;
    while (py > sy) {
      alpha = data[(py - 1) * 4 + 3];
      if (alpha === 0) {
        ey = py;
      } else {
        sy = py;
      }
      py = (ey + sy) >> 1;
    }
    ratio = py / ih;
    if (ratio === 0) {
      return 1;
    } else {
      return ratio;
    }
  };

  drawImageIOSFix = function(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
    var vertSquashRatio;
    vertSquashRatio = detectVerticalSquash(img);
    return ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh / vertSquashRatio);
  };


  /*
   * contentloaded.js
   *
   * Author: Diego Perini (diego.perini at gmail.com)
   * Summary: cross-browser wrapper for DOMContentLoaded
   * Updated: 20101020
   * License: MIT
   * Version: 1.2
   *
   * URL:
   * http://javascript.nwbox.com/ContentLoaded/
   * http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
   */

  contentLoaded = function(win, fn) {
    var add, doc, done, init, poll, pre, rem, root, top;
    done = false;
    top = true;
    doc = win.document;
    root = doc.documentElement;
    add = (doc.addEventListener ? "addEventListener" : "attachEvent");
    rem = (doc.addEventListener ? "removeEventListener" : "detachEvent");
    pre = (doc.addEventListener ? "" : "on");
    init = function(e) {
      if (e.type === "readystatechange" && doc.readyState !== "complete") {
        return;
      }
      (e.type === "load" ? win : doc)[rem](pre + e.type, init, false);
      if (!done && (done = true)) {
        return fn.call(win, e.type || e);
      }
    };
    poll = function() {
      var e;
      try {
        root.doScroll("left");
      } catch (_error) {
        e = _error;
        setTimeout(poll, 50);
        return;
      }
      return init("poll");
    };
    if (doc.readyState !== "complete") {
      if (doc.createEventObject && root.doScroll) {
        try {
          top = !win.frameElement;
        } catch (_error) {}
        if (top) {
          poll();
        }
      }
      doc[add](pre + "DOMContentLoaded", init, false);
      doc[add](pre + "readystatechange", init, false);
      return win[add](pre + "load", init, false);
    }
  };

  Dropzone._autoDiscoverFunction = function() {
    if (Dropzone.autoDiscover) {
      return Dropzone.discover();
    }
  };

  contentLoaded(window, Dropzone._autoDiscoverFunction);

}).call(this);