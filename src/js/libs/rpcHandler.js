"use strict";
var rpcHandler = function(client, server) {
    this.client = client;
    this.server = server;
}
rpcHandler.prototype.sendResponse = function(req) {
    var isArray = false;
    var _this = this;
    if(!Array.isArray(req)) console.log(req.method);
    if (Array.isArray(req)) {
        isArray = true;
        for (var i in req) {
            console.log(req[i].method);
            if (req[i].method && rpcHandler.allowedMethods.indexOf(req[i].method) == -1) {
                this.write(rpcHandler.getInvalidMethod(req[i].method, req[i].id));
                return;
            }
        }
    } else if (req.method && rpcHandler.allowedMethods.indexOf(req.method) == -1) {
        this.write(rpcHandler.getInvalidMethod(req.method, req.id));
        return;
    } else if (!req.method) {
        this.write(rpcHandler.getInvalidMethod('Invalid number of input parameters', req.id));
        return;
    }
    if (!isArray && rpcHandler.privMethods.indexOf(req.method) != -1) {
        if (req.method == "eth_accounts") {
            _this.write({ jsonrpc: "2.0", result: ['0x7cb57b5a97eabe94205c07890be4c1ad31e486a8'], id: req.id });
        } else if (req.method == "eth_coinbase") {
            _this.write({ jsonrpc: "2.0", result: '0x7cb57b5a97eabe94205c07890be4c1ad31e486a8', id: req.id });
        }
    } else {
        this.getResponse(req, function(res) {
            _this.write(res);
        });
    }
}
rpcHandler.prototype.write = function(data) {
    var _this = this;
    _this.client.write(JSON.stringify(data));

}
rpcHandler.prototype.getResponse = function(body, callback) {
    var _this = this;
    _this.server.call(body, function(err, res, body) {
        if (err) Events.Error(err);
        else callback(body);
    });
}
rpcHandler.getInvalidMethod = function(methodName, id) {
    return { result: { "jsonrpc": "2.0", "error": { "code": -32601, "message": "{" + methodName + "} Method not found or unavailable", "data": null }, "id": id }, headers: [] };
}
rpcHandler.allowedMethods = require('./methods/allowedMethods.json');
rpcHandler.privMethods = require('./methods/privMethods.json');
module.exports = rpcHandler;
