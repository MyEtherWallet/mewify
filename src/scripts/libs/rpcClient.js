"use strict";
var parityOutputProcessor = require('./parityOutputProcessor');
var rpcRateLimiter = require('./rpcRateLimiter');
var rpcClient = function(server) {
    this.server = server;
    this.parityOutputProcessor = new parityOutputProcessor();

    rpcRateLimiter.init(server);
}

rpcClient.prototype.call = function(body, retries, callback) {
    rpcRateLimiter.processRequest(body, function(error, response, body) {
      callback(error, response, body, retries);
    });
}

rpcClient.prototype.getResponse = function(body, callback) {
    var _this = this;
    var _body = body;
    _this.parityOutputProcessor.preProcess(body);
    var resHandler = function(err, res, body, retries) {
        if (err) {
            if (retries >= 5) {
                console.log(err);
                Events.Error(err.message);
                callback({ "jsonrpc": "2.0", "error": { "code": -1, "message": "Connection Error", "data": null }, "id": _body.id });
            } else {
                _this.call(_body, (retries + 1), resHandler);
            }
        } else {
            body = _this.parityOutputProcessor.postProcess(body);
            callback(body);
        }
    };
    _this.call(body, 0, resHandler);
}


module.exports = rpcClient;
