var favicon = require('serve-favicon');
var mongoose = require('mongoose');
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var connect = require("connect");
var logger = require('morgan');
var express = require('express');
var config = require('config.json')('./config.json');

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

module.exports = function (app) {

    app.use(favicon(__dirname + '/build/assets/images/favicon.ico'));

    app.use(express.static(config.staticFiles));
    app.use(express.static(config.bowerComponents));

    app.use(logger('dev'));

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());

    app.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true },
        store: new MongoStore({
            mongooseConnection: mongoose.connection
        })
    }));
};