"use strict";
var privMethodHandler = require('./privMethodHandler');
var rpcHandler = function(client, server) {
    this.client = client;
    this.server = server;
    this.privMethodHandler = new privMethodHandler(server);

    this.httpResponseQueue = [];
    this.reqIsArr = false;
    this.reqLength = 0;
}
rpcHandler.prototype.sendResponse = function(req) {
    var isArray = false;
    var _this = this;
    if (Array.isArray(req)) {

        if (_this.client.connType === 'http') {
            _this.reqIsArr = true;
            _this.reqLength = req.length;
        }

        isArray = true;
        for (var i in req) {
            if (req[i].method && rpcHandler.isFrozenMethod(req[i].method)) {
                this.write(rpcHandler.getFrozenMethod(req[i].method, req[i].id));
                req.splice(i, 1);
            }
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
    } else if (req.method && rpcHandler.isFrozenMethod(req.method, req.id)) {
        return this.write(rpcHandler.getFrozenMethod(req.method, req.id))
    } else if (req.method && !rpcHandler.isAllowedMethod(req.method)) {
        return this.write(rpcHandler.getInvalidMethod(req.method, req.id));
    } else if (!req.method) {
        return this.write(rpcHandler.getInvalidMethod('Invalid number of input parameters', req.id));
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
    var _this = this;
    if (_this.client.connected) {
        if (_this.client.connType === "ipc") {
            _this.client.write(JSON.stringify(data));
        }
        else if (_this.client.connType === "http") {
            if (!_this.reqIsArr) return _this.client.json(data);
            if (!Array.isArray(data)) data = [data];
            _this.httpResponseQueue = _this.httpResponseQueue.concat(data);
            if (_this.reqLength === _this.httpResponseQueue.length) {
                _this.client.json(_this.httpResponseQueue);
            }
        }
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
rpcHandler.isFrozenMethod = function(method) {
    return Object.keys(rpcHandler.frozenMethods).indexOf(method) !== -1;
}
rpcHandler.getFrozenMethod = function(method, id) {
    console.log('getFrozenMethod: ' + method);
    var resp = JSON.parse(rpcHandler.frozenMethods[method]);
    resp.id = id;
    return resp;
}
rpcHandler.remoteMethods = require('./methods/remoteMethods.json');
rpcHandler.privMethods = require('./methods/privMethods.json');
rpcHandler.frozenMethods = require('./methods/frozenMethods.json');
module.exports = rpcHandler;
