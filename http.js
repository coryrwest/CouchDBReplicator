var promise = require('promise');
var request = require('request');

var http = {};

http.get = function(url) {
    return new promise(function(resolve, reject) {
        request.get(url, function (err, res, body) {
            if (err) {
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
};

http.post = function(url, data) {
    return new promise(function(resolve, reject) {
        request({
            url: url,
            method: 'POST',
            json: true,
            body: data
        }, function (err, res, body) {
            if (err) {
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
};

module.exports = http;