var mongoose = require('mongoose');
var express = require('express');
var MongoStore = require('connect-mongodb')(express);

var sessionStore = new MongoStore({
    mongoose_connection: mongoose.connection
});

module.exports = sessionStore;