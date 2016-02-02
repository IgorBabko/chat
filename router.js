module.exports = function (app) {
    app.get ('/',       require('./routes/index' ).get);
    app.post('/signup', require('./routes/signup').post);
    app.post('/login',  require('./routes/login' ).post);
    app.post('/logout', require('./routes/logout').post);
    app.post('/guest', require('./routes/guest').post);



    app.get('/niko', function(req, res) {
        res.sendFile(__dirname + '/build/index1.html');
    });
}