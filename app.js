var server = require('./server');
var clients = require('socket.io').listen(server);
var handlers = require('./handlers')(clients);

require("./mongooseConnect");
require("./setupEventHandlers")(
    clients, handlers
);