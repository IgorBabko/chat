require("./mongooseConnect");

var server = require('./server');
var clients = require('socket.io').listen(server);

////////////

// clients.use(function(socket, next) {
//   var handshakeData = socket.request.session;
//   console.log(handshakeData);
//   // make sure the handshake data looks good as before
//   // if () {
//   //   next(new Error('not authorized');
//   // } else {
//     next();
//   // }
// });


///////////

var handlers = require('./handlers')(clients);

require("./setupEventHandlers")(
    clients, handlers
);