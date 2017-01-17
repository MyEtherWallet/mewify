"use strict";
var ipcProvider = require('./ipcProvider');
var httpProvider = require('./httpProvider');
var clientHandler = function(path, httpPort, httpsPort) {
    fileIO.deleteFileSync(path);
    this.ipcProvider = new ipcProvider(path, netIO.net);
    this.httpProvider = new httpProvider(httpPort, httpsPort);
}
clientHandler.prototype.disconnect = function(){
    this.ipcProvider.disconnect();
    this.httpProvider.disconnect();
}
module.exports = clientHandler;
