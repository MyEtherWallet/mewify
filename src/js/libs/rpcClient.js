"use strict";
var parityOutputProcessor = require('./parityOutputProcessor');
var rpcClient = function(server) {
    this.server = server;
    this.request = netIO.request.defaults({ jar: true });
    this.parityOutputProcessor = new parityOutputProcessor();
}
rpcClient.prototype.call = function(body, callback) {
    var _this = this;
    _this.request({
        url: _this.server,
        method: "POST",
        json: true,
        body: body
    }, function(error, response, body) {
        callback(error, response, body);
    });
}
rpcClient.prototype.getResponse = function(body, callback) {
    var _this = this;
    _this.parityOutputProcessor.preProcess(body);
    _this.call(body, function(err, res, body) {
        if (err) Events.Error(err);
        else {
            body = _this.parityOutputProcessor.postProcess(body);
            callback(body);
        }
    });
}
module.exports = rpcClient;
