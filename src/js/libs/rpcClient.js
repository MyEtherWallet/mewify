"use strict";
var rpcClient = function(server) {
    this.server = server;
    this.request = netIO.request.defaults({ jar: true });
}
rpcClient.prototype.call = function (body, callback) {
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
module.exports = rpcClient;
