module.exports = function (app) {
    app.get('/', function(req, res) {
        res.sendFile(__dirname + '/build/index.html');
    });

    app.get('/niko', function(req, res) {
        res.sendFile(__dirname + '/build/index1.html');
    });
}