var session = require('express-session');
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var connect = require("connect");
var logger = require('morgan');
var express = require('express');

var config = require('./config');

// var favicon = require('serve-favicon');
// uncomment after placing your favicon in /public
// app.use(favicon(__dirname + '/public/favicon.ico'));

module.exports = function (app) {
    
    app.use(express.static(config.get('staticFiles')));
    app.use(express.static(config.get('bowerComponents')));

    app.use(logger('dev'));

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());

    var MongoStore = require('connect-mongo')(app);

    app.use(session({
      secret: config.get('session:secret'),
      key: config.get('session:key'),
      cookie: config.get('session:cookie'),
      store: new MongoStore({mongoose_connection: mongoose.connection})
    }));
};