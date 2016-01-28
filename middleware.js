var session = require('express-session');
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var connect = require("connect");
var logger = require('morgan');
var express = require('express');

// var favicon = require('serve-favicon');
// uncomment after placing your favicon in /public
// app.use(favicon(__dirname + '/public/favicon.ico'));

module.exports = function (app) {
    
    app.use(express.static(__dirname + '/build/assets'));
    app.use(express.static(__dirname + '/bower_components'));

    app.use(logger('dev'));

    app.use(cookieParser());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.use(session({
      secret: 'secret',
      key: 'express.sid',
      resave: false,
      saveUninitialized: true
    }));
};