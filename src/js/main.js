var angular = require('angular');
var configs = require('./libs/configs');
window.configs = configs;
var ipcProvider = require('./libs/ipcProvider');
window.ipcProvider = ipcProvider;
var rpcClient = require('./libs/rpcClient');
window.rpcClient = rpcClient;
var rpcHandler = require('./libs/rpcHandler');
window.rpcHandler = rpcHandler;
var privMethodHandler = require('./libs/privMethodHandler');
window.privMethodHandler = privMethodHandler;
var configCtrl = require('./controllers/configCtrl');

var app = angular.module('mewifyApp', []);
app.controller('configCtrl', ['$scope', configCtrl]);
