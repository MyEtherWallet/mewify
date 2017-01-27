"use strict";
var rpcClient = require('./rpcClient');
var rpcHandler = require('./rpcHandler');
var IpcProvider = function(path, net) {
    var _this = this;
    this.responseCallbacks = {};
    this.path = path;
    this.clients = [];
    this.rpcClient = new rpcClient(configs.getNodeUrl());
    this.openSockets = {};
    var nextSocketId = 0;
    var onConnection = function(socket) {
        var socketId = nextSocketId;
        console.log('ipc connection', socketId, 'opened');
        _this.openSockets[socketId] = socket;
        nextSocketId++;
        socket.on('close', function() {
            console.log('ipc connection', socketId, 'closed');
            delete _this.openSockets[socketId];
        });
        socket.on('error', function(err) {
            console.log('socket', socketId, err);
        });
    }
    this.server = net.createServer(function(client) {
        client.connected = true;
        client.connType = "ipc";
        client.rpcHandler = new rpcHandler(client, _this.rpcClient);
        client.on('data', function(data) {
            _this._parseResponse(data.toString()).forEach(function(result) {
                client.rpcHandler.sendResponse(result);
            });
        });
    });
    this.server.on('close', function(e) {
        console.log('Connection closed');
    });
    this.server.on('error', function(e) {
        console.error('IPC Connection Error', e);
        Events.Error(e.message);
    });
    this.server.listen({ path: this.path }, function() {
        console.log("ipc server started");
    });
    this.server.on('connection', onConnection);
};

IpcProvider.prototype._parseResponse = function(data) {
    var _this = this,
        returnValues = [];

    // DE-CHUNKER
    var dechunkedData = data
        .replace(/\}[\n\r]?\{/g, '}|--|{') // }{
        .replace(/\}\][\n\r]?\[\{/g, '}]|--|[{') // }][{
        .replace(/\}[\n\r]?\[\{/g, '}|--|[{') // }[{
        .replace(/\}\][\n\r]?\{/g, '}]|--|{') // }]{
        .split('|--|');
    dechunkedData.forEach(function(data) {
        if (_this.lastChunk)
            data = _this.lastChunk + data;
        var result = null;
        try {
            result = JSON.parse(data);
        } catch (e) {
            _this.lastChunk = data;
            return;
        }
        if (result)
            returnValues.push(result);
    });
    return returnValues;
};

IpcProvider.prototype.disconnect = function() {
    this.server.close(function() {
        console.log("ipc server closed");
    });
    for (var socketId in this.openSockets) {
        console.log('ipc connection', socketId, 'destroyed');
        this.openSockets[socketId].destroy();
        delete this.openSockets[socketId];

    }
};

module.exports = IpcProvider;
