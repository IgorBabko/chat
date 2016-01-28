var app = require('express')();

require("./middleware")(app);
require("./router")(app);

var server = app.listen(
    process.env.OPENSHIFT_NODEJS_PORT || '8000',
    process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
);

module.exports = server;