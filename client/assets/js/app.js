;
$(function() {
    var socket = io('http://' + window.location.hostname + ':8000');
    var validErrorsSound = new Audio('/music/valid_errors.mp3');
    var messageSound = new Audio('/music/message.mp3');
    var invitationSound = new Audio('/music/invitation.mp3');
    var actionPerformedSound = new Audio('/music/action_performed.mp3');
    var privateMessageSound = new Audio('/music/private_message.mp3');
    var generalSound = new Audio('/music/enter_left.mp3');
    $('img#avatar').imgAreaSelect({
        handles: true,
        parent: $('#enter-chat-modal .modal-content')
    });
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
        // scaleMessage();
    });

    // function scaleMessage() {
    //     $("#messages .media:last-child").addClass("scaledDown");
    //     setTimeout(function() {
    //         $("#messages .media:last-child").removeClass("scaledDown").addClass("scaledUp");
    //     }, 0.001);
    // }

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
    // function joinedHandler(e) {
    //     if (e.type === 'click' || e.keyCode == 13) {
    //         socket.emit('joined', $("#username").val());
    //     }
    // }
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
    socket.on("enterAsGuest", function(data) {
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
    // $("#enter-chat-button").on('click', joinedHandler);
    // $("#username").on('keypress', joinedHandler);
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
            if (errors.hasOwnProperty(inputId)) {
                addErrorState($input, errors[inputId]);
            } else if ($input.hasClass("form-control-danger") && !errors.hasOwnProperty(inputId)) {
                removeErrorState($input);
            }
        });
        $("#" + modalId + " .form-control-danger").first().select();
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
    $("#create-room-modal .form input").on("keypress", function(e) {
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
    socket.on("guestLeft", function(data) {
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
    var avatar = null;
    var enterMode = "login";
    $(".signup-item").on("click", function() {
        $("#enter-chat-button").val("Sign Up");
        if (enterMode === "signup") {
            return;
        }
        enterMode = "signup";
        setTimeout(function() {
            $("#username").focus();
        }, 1);
        $("#enter-chat-modal .form > div").hide();
        $("#signup").show();
        $(".nav-item a").removeClass("active");
        $(".signup-item a").addClass("active");
        if (!avatar) {
            avatar = $('#avatar').croppie({
                viewport: {
                    width: 300,
                    height: 300,
                    type: "circle"
                }
            });
            avatar.croppie('bind', {
                url: 'images/male.jpg'
            });
            avatar.croppie('result', 'html');
        }
    });

    function collectFormData(formId) {
        var formData = {};
        var inputs = $("#" + formId + " input");
        $.each(inputs, function(i, input) {
            formData[input.id] = $("#" + input.id).val();
        });
        return formData;
    }

    function login(formData) {
        socket.emit("login", {
            userData: formData
        });
    }

    function signup(formData) {
        avatar.croppie('result', {
            type: 'canvas',
            size: 'original'
        }).then(function(avatarBase64) {
            formData.avatarBase64 = avatarBase64;
            socket.emit("signup", formData);
        });
    }
    // люси дженсон
    function enterAsGuest(formData) {
        socket.emit("enterAsGuest", formData);
    }

    function enterChatHandler() {
        var formData = collectFormData(enterMode);
        switch (enterMode) {
            case "login":
                login(formData);
                break;
            case "signup":
                signup(formData);
                break;
            case "guest":
                enterAsGuest(formData);
                break;
        }
    }

    $('#enter-chat-button').on('click', enterChatHandler);
    
    $(".form input[type=text], .form input[type=password], .form input[type=hidden]").on("keypress", function(e) {
        if (e.keyCode == 13) {
            enterChatHandler();
        }
    });
    
    // male-female radio handler
    $(".gender input[type='radio']").on("change", function() {
        socket.emit("changeDefaultAvatar", $(this).val());
    });
    socket.on("changeDefaultAvatar", function(avatarPath) {
        avatar.croppie('bind', {
            url: avatarPath
        });
    });
    $(".avatar-block input").on("change", function() {
        if (this.files && this.files[0]) {
            var reader = new FileReader();
            reader.onload = function(e) {
                avatar.croppie('bind', {
                    url: e.target.result
                });
            }
            reader.readAsDataURL(this.files[0]);
        }
    });
    $(".guest-item").on("click", function() {
        $("#enter-chat-button").val("Enter");
        if (enterMode === "guest") {
            return;
        }
        enterMode = "guest";
        setTimeout(function() {
            $("#name").focus();
        }, 1);
        $("#enter-chat-modal .form > div").hide();
        $("#guest").show();
        $(".nav-item a").removeClass("active");
        $(".guest-item a").addClass("active");
    });
    $(".login-item").on("click", function() {
        $("#enter-chat-button").val("Log In");
        if (enterMode === "login") {
            return;
        }
        enterMode = "login";
        setTimeout(function() {
            $("#usernameOrEmail").focus();
        }, 1);
        $("#enter-chat-modal .form > div").hide();
        $("#login").show();
        $(".nav-item a").removeClass("active");
        $(".login-item a").addClass("active");
    });
});