var _ = require('lodash');
var EventEmitter = require("events").EventEmitter,
    util = require("util")

function phantomRequest(requestOptions, cb) {
    var request = new EventEmitter();
    var pageSource = '';
    request.emit('data', pageSource);
    request.emit('end');
}


module.exports = {
    request: phantomRequest
};
