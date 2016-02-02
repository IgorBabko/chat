module.exports = function (clients, handlers) {
    
    // clients.set('authorization', function (handshakeData, accept) {
    //     if (handshakeData.headers.cookie) {
    //         handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
    //         handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['express.sid'], 'secret');
    //     }
    //     if (handshakeData.cookie['express.sid'] == handshakeData.sessionID) {
    //         return accept('Cookie is invalid.', false);
    //     } else {
    //         return accept('No cookie transmitted.', false);
    //     } 
    //     accept(null, true);
    // });


    clients.on('connection', function(socket) {
        // console.log(socket.handshake);
        socket
            .on("message", function(text) {
                handlers.addMessage(text, socket);
            })
            .on("changeDefaultAvatar", function(gender) {
                // @TODO Check if gender pic exists
                socket.emit("changeDefaultAvatar", "images/" + gender + ".jpg");
            })
            .on("enterAsGuest", function(guestData) {
                handlers.enterAsGuest(guestData, socket);
            })
            .on("signup", function(userData) {
                handlers.signup(userData, socket);
            })
            .on("login", function(userData) {
                handlers.login(userData);
            })
            .on("createRoom", function(roomInfo) {
                handlers.createRoom(roomInfo, socket);
            })
            .on("disconnect", function() {
                handlers.guestLeft(socket);
            })
            .on("changeRoom", function(roomInfo) {
                handlers.changeRoom(roomInfo, socket);
            })
            .on("deleteRoom", function(data) {
                handlers.deleteRoom(data, socket);
            })
            .on("searchRoom", function(data) {
                handlers.searchRoom(data.searchPattern, data.currentRoomId, socket);
            })
            .on("startTyping", function(id) {
                socket.broadcast.to(socket.room).emit("startTyping", id);
            })
            .on("stopTyping", function(id) {
                socket.broadcast.to(socket.room).emit("stopTyping", id);
            });
    });

    return clients;
};