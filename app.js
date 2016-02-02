require("./mongooseConnect");

var server = require('./server');

var clients = require('socket.io').listen(server);
var handlers = require('./handlers')(clients);

require("./setupEventHandlers")(
    clients, handlers
);