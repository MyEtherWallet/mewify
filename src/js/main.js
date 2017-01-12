var angular = require('angular');
var configs = {};
configs.paths = require('../../configs/paths.json');
configs.default = require('../../configs/default.json');
window.configs = configs;
var ipcProvider = require('./libs/ipcProvider');
window.ipcProvider = ipcProvider;
var rpcClient = require('./libs/rpcClient');
window.rpcClient = rpcClient;
var rpcHandler = require('./libs/rpcHandler');
window.rpcHandler = rpcHandler;
var configCtrl = require('./controllers/configCtrl');

var app = angular.module('mewifyApp', []);
app.controller('configCtrl', ['$scope', configCtrl]);
