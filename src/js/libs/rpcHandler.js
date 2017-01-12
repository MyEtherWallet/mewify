"use strict";
var rpcHandler = function(client, server) {
    this.client = client;
    this.server = server;
}
rpcHandler.prototype.sendResponse = function(req) {
    var isArray = false;
    var _this = this;
    if (Array.isArray(req)) {
        isArray = true;
        for (var i in req) {
            if (req[i].method && rpcHandler.allowedMethods.indexOf(req[i].method) == -1) {
                this.write(this.getInvalidMethod(req[i].method, req[i].id));
                return;
            }
        }
    } else if (req.method && rpcHandler.allowedMethods.indexOf(req.method) == -1) {
        this.write(this.getInvalidMethod(req.method, req.id));
        return;
    } else if (!req.method) {
        this.write(this.getInvalidMethod('Invalid number of input parameters', req.id));
        return;
    }
    if (!isArray && rpcHandler.privMethods.indexOf(req.method) != -1) {
        if (req.method == "eth_accounts") {
            _this.write({ jsonrpc: "2.0", result: [], id: req.id });
        }
    } else {
        this.getResponse(req, function(res) {
            _this.write(res);
        });
    }
}
rpcHandler.prototype.write = function(data) {
    console.log("writing", data);
    this.client.write(JSON.stringify(data));
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
