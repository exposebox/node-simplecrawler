var debug = require('debug')('phantomClient');
var _ = require('lodash');
var EventEmitter = require("events").EventEmitter,
    util = require("util");
var phridge = require('phridge');


/*
 * PhantomResponse
 * */
function PhantomResponse() {
    this.pageSource = new Buffer('mumudecau');
    this.statusCode = 200;
    this.headers = {
        "content-length": '9',
        "content-type": 'text/plain'
    };

    this.socket = {
        destroy: function () {
            debug('called destroy.')
        }
    };

    var response = this;
    setTimeout(function () {
        response.emit('data', response.pageSource);
        response.emit('end');
    }, 1000);
}

util.inherits(PhantomResponse, EventEmitter);

/*
 * PhantomRequest
 * */
function PhantomRequest(requestOptions, cb) {
    debug('performing request via phantom!');
    var response = new PhantomResponse();
    var spawnOpts = {};
    phridge.spawn(spawnOpts)
        .then(function (phantom) {
            debug('phantom spawned');
            var page = phantom.createPage();
            page.run(requestOptions, function (requestOptions, resolve, reject) {

                console.log('phantom> loading page:', product);
                // `this` is now a webpage instance
                var page = this;

                var waitResponseInterval = 500;
                var reqResInterval = null;
                var reqResFinished = false;
                var resetTimeout = function () {
                    if (reqResInterval)
                        clearTimeout(reqResInterval);

                    reqResInterval = setTimeout(function () {
                        reqResFinished = true;
                        page.onLoadFinished("success");
                    }, waitResponseInterval);
                };

                page.onResourceReceived = function (response) {
                    // console.log('Response (#' + response.id + ')');
                    resetTimeout()
                };

                page.onResourceRequested = function (requestData, networkRequest) {
                    // console.log('Request (#' + requestData.id + ')');
                    resetTimeout()
                };

                page.onLoadFinished = function (status) {
                    if (!reqResFinished) {
                        // console.log('onLoadFinished Status: ' + status);
                        if (page.injectJS('jquery.js')) {
                            console.log('INJECTION SUCCESSFUL')
                            var newPage = page.evaluate(function () {
                                var pageSource = $('html').html();
                                // console.log('PAGE SOURCE');
                                // console.log('===========');
                                // console.log(pageSource);
                                return pageSource;
                            });
                            resolve(newPage);
                            return
                        }
                        else {
                            reject('JQuery INJECTION FAILED')
                        }
                    }

                    reqResFinished = false
                };

                this.open(product, function (status) {
                    if (status !== "success") {
                        return reject(new Error("Cannot load " + this.reason_url +
                            " due to " + this.reason));
                    }

                    console.log('finished opening page!');
                    resetTimeout();
                });

            }).then(function (pageSource) {
                cb(pageSource);
            }).catch(function (err) {
                debug('FAILED TO GET PAGE SOURCE VIA PHANTOM!', err);
                cb('');
            });
        })
        .catch(function (err) {
            debug('failed to spawn phantom:', err.message)
            debug('error stack:', err.stack)
        });
}

PhantomRequest.prototype.end = function () {
    this.emit('end');
};

PhantomRequest.prototype.setTimeout = function (timeout, cb) {
};


util.inherits(PhantomRequest, EventEmitter);

/*
 * EXPORTS
 * */
module.exports = {
    request: function (requestOptions, cb) {
        return new PhantomRequest(requestOptions, cb);
    }
};
