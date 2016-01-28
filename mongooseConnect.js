var mongoose = require("mongoose");
var Guest = require('./models/guest');
var Room = require('./models/room');

var connectionString = require('./config').get('mongoose:uri');
if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
    connectionString = process.env.OPENSHIFT_MONGODB_DB_name
                        + ":" + process.env.OPENSHIFT_MONGODB_DB_PASSWORD
                        + "@" + process.env.OPENSHIFT_MONGODB_DB_HOST
                        + ':' + process.env.OPENSHIFT_MONGODB_DB_PORT
                        + '/' + process.env.OPENSHIFT_APP_NAME;
}

mongoose.connect('mongodb://' + connectionString, function(err, db) {
    Guest.remove(function() {});
    Room.update({}, {
        $set: {
            peopleCount: 0
        }
    }, {
        multi: true
    }, function() {});
});