"use strict";
var parityOutputProcessor = function() {
    this.processMethods = {
        "eth_getTransactionReceipt": "ethGetTransactionReceipt"
    };
    this.queue = {};
}
parityOutputProcessor.prototype.preProcess = function(req) {
    var _this = this;
    if (Array.isArray(req)) {
        req.forEach(function(obj) {
            if (_this.processMethods[obj.method]) {
                _this.queue[obj.id] = _this.processMethods[obj.method];
            }
        });
    } else if (_this.processMethods[req.method]) {
        _this.queue[req.id] = _this.processMethods[req.method];
    }
}
parityOutputProcessor.prototype.postProcess = function(resp) {
    var _this = this;
    if (Array.isArray(resp)) {
        resp.forEach(function(obj) {
            if (_this.queue[obj.id]) {
                obj = parityOutputProcessor[_this.queue[obj.id]](obj);
                delete _this.queue[obj.id];
            }
        });
    } else if (_this.queue[resp.id]) {
        resp = parityOutputProcessor[_this.queue[resp.id]](resp);
        delete _this.queue[resp.id];
    }
    return resp;
}
parityOutputProcessor.ethGetTransactionReceipt = function(obj) {
    if (obj.result && !obj.result.blockNumber) obj.result = null;
    return obj;
}
module.exports = parityOutputProcessor;
