var path = require('path');

exports.get = function (req, res, next) {
    // res.end('index');
    res.sendFile(path.resolve('build/index.html'));
}