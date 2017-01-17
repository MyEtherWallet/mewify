"use strict";
var rpcClient = require('./rpcClient');
var rpcHandler = require('./rpcHandler');
var IpcProvider = function(path, net) {
    var _this = this;
    this.responseCallbacks = {};
    this.path = path;
    this.clients = [];
    this.rpcClient = new rpcClient(configs.getNodeUrl());
    this.server = net.createServer(function(client) {
        console.log("new Client! Total Clients: " + _this.clients.length);
        Events.Info("new Client! Total Clients: " + _this.clients.length);
        client.connected = true;
        client.connType = "ipc";
        client.rpcHandler = new rpcHandler(client, _this.rpcClient);
        client.on('data', function(data) {
            _this._parseResponse(data.toString()).forEach(function(result) {
                client.rpcHandler.sendResponse(result);
            });
        });
        client.on('end', function() {
            client.connected = false;
            _this.clients.splice(_this.clients.indexOf(client), 1);
        });
        _this.clients.push(client);
    });
    this.server.on('listening', function() {
        console.log('Connection started');
    });
    this.server.on('close', function(e) {
        console.log('Connection closed');
    });
    this.server.on('error', function(e) {
        console.error('IPC Connection Error', e);
    });
    this.server.listen({ path: this.path });
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

IpcProvider.prototype.isConnected = function() {
    return this.server.listening;
};

IpcProvider.prototype.disconnect = function() {
    this.server.close();
};

IpcProvider.prototype.send = function(payload) {
    this.connection.write(JSON.stringify(payload));
};

module.exports = IpcProvider;
