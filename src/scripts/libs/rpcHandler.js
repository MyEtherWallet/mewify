"use strict";
var privMethodHandler = require('./privMethodHandler');
var rpcHandler = function(client, server) {
    this.client = client;
    this.server = server;
    this.privMethodHandler = new privMethodHandler(server);
}
rpcHandler.prototype.sendResponse = function(req) {
    console.log(req);
    var isArray = false;
    var _this = this;
    if (Array.isArray(req)) {
        isArray = true;
        for (var i in req) {
            if (req[i].method && !rpcHandler.isAllowedMethod(req[i].method)) {
                this.write(rpcHandler.getInvalidMethod(req[i].method, req[i].id));
                req.splice(i, 1);
            }
            if (req[i].method && rpcHandler.isPrivMethod(req[i].method)) {
                var handlePriv = function(treq) {
                    _this.privMethodHandler.handle(treq.method, treq.params, function(data) {
                        if (data.error) _this.write(rpcHandler.getErrorMsg(data.msg, treq.id))
                        else {
                            _this.write(rpcHandler.getResultMsg(data.data, treq.id));
                        }
                    });
                }
                handlePriv(req[i]);
                req.splice(i, 1);
            }
        }
    } else if (req.method && !rpcHandler.isAllowedMethod(req.method)) {
        this.write(rpcHandler.getInvalidMethod(req.method, req.id));
    } else if (!req.method) {
        this.write(rpcHandler.getInvalidMethod('Invalid number of input parameters', req.id));
    }
    if (Array.isArray(req)) {
        if (req.length)
            _this.server.getResponse(req, function(res) {
                _this.write(res);
            });
    } else {
        if (rpcHandler.isPrivMethod(req.method)) {
            _this.privMethodHandler.handle(req.method, req.params, function(data) {
                if (data.error) _this.write(rpcHandler.getErrorMsg(data.msg, req.id))
                else {
                    _this.write(rpcHandler.getResultMsg(data.data, req.id));
                }
            });
        } else {
            _this.server.getResponse(req, function(res) {
                _this.write(res);
            });
        }
    }
}
rpcHandler.prototype.write = function(data) {
    //console.log(data);
    var _this = this;
    if (_this.client.connected){
        console.log(data);
        if(_this.client.connType=="ipc") _this.client.write(JSON.stringify(data));
        else if(_this.client.connType=="http") _this.client.json(data);
    }
}
rpcHandler.getInvalidMethod = function(methodName, id) {
    Events.Error("{" + methodName + "} Method not found or unavailable");
    return { "jsonrpc": "2.0", "error": { "code": -32601, "message": "{" + methodName + "} Method not found or unavailable", "data": null }, "id": id };
}
rpcHandler.getErrorMsg = function(error, id) {
    Events.Error(error);
    return { "jsonrpc": "2.0", "error": { "code": -1, "message": error, "data": null }, "id": id };
}
rpcHandler.getResultMsg = function(result, id) {
    return { jsonrpc: "2.0", result: result, id: id };
}
rpcHandler.isPrivMethod = function(method) {
    return rpcHandler.privMethods.indexOf(method) > -1;
}
rpcHandler.isAllowedMethod = function(method) {
    return rpcHandler.remoteMethods.indexOf(method) > -1 || rpcHandler.isPrivMethod(method);
}
rpcHandler.remoteMethods = require('./methods/remoteMethods.json');
rpcHandler.privMethods = require('./methods/privMethods.json');
module.exports = rpcHandler;
