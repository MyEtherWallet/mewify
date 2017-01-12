/*
    This file is part of web3.js.

    web3.js is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    web3.js is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/
/** @file ipcprovider.js
 * @authors:
 *   Fabian Vogelsteller <fabian@ethdev.com>
 * @date 2015
 */

"use strict";

var errors = require('./ipcErrors');

var IpcProvider = function(path, net) {
    var _this = this;
    this.responseCallbacks = {};
    this.path = path;
    this.clients = [];
    this.rpcClient = new rpcClient(configs.default.node);
    this.server = net.createServer(function(client) {
        console.log("new Client");
        client.rpcHandler = new rpcHandler(client, _this.rpcClient);
        client.on('data', function(data) {
            _this._parseResponse(data.toString()).forEach(function(result) {
                console.log("new response", result);
                client.rpcHandler.sendResponse(result);
            });
        });
        client.on('end', function() {
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
