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
function PhantomRequest(requestOptions, pageSourceCallback) {
    debug('performing request via phantom!');
    var response = new PhantomResponse();
    var spawnOpts = {};
    phridge.spawn(spawnOpts)
        .then(function (phantom) {
            debug('phantom spawned');
            var url = requestOptions.queueItemUrl;
            var page = phantom.createPage();
            page.run(url, function (url, resolve, reject) {

                console.log('phantom> loading page:', url);
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
                        console.log('onLoadFinished Status: ' + status);
                        console.log('===========');
                        // var newPage = page.evaluate(function () {
                        //     // var pageSource = $('html').html();
                        //     console.log('===========');
                        var pageSource = document.documentElement.innerHTML;
                        console.log('PAGE SOURCE');
                        console.log('===========');
                        console.log(pageSource);
                        //     return pageSource;
                        // });
                        // resolve(newPage);
                        resolve(pageSource);
                        return;
                    }

                    reqResFinished = false;
                };

                this.open(url, function (status) {
                    if (status !== "success") {
                        return reject(new Error("Cannot load " + this.reason_url +
                            " due to " + this.reason));
                    }

                    // console.log('finished opening page!');
                    resetTimeout();
                });

            }).then(pageSourceCallback).catch(function (err) {
                debug('FAILED TO GET PAGE SOURCE VIA PHANTOM! ERR:', err);
                pageSourceCallback('');
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
