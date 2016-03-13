var debug = require('debug')('phantomClient')
var _ = require('lodash');
var EventEmitter = require("events").EventEmitter,
    util = require("util")

/*
 * PhantomResponse
 * */
function PhantomResponse() {
    this.pageSource = new Buffer('mumudecau');
    this.statusCode = 200;
    this.headers = {
        "content-length": '9',
        "content-type": 'text/plain'
    }

    this.socket = {
        destroy: function () {
            debug('called destroy.')
        }
    }

    var response = this;
    setTimeout(function () {
        response.emit('data', response.pageSource);
        response.emit('end');
    }, 1000)
}

util.inherits(PhantomResponse, EventEmitter);

/*
 * PhantomRequest
 * */
function PhantomRequest(requestOptions, cb) {
    debug('performing request via phantom!');
    var response = new PhantomResponse();
    cb(response);
}

PhantomRequest.prototype.end = function () {
    this.emit('end');
}

PhantomRequest.prototype.setTimeout = function (timeout, cb) {
}


util.inherits(PhantomRequest, EventEmitter);

/*
 * EXPORTS
 * */
module.exports = {
    request: function (requestOptions, cb) {
        return new PhantomRequest(requestOptions, cb);
    }
};
