var angular = require('angular');
window.configs = require('./libs/configs');
window.clientHandler = require('./libs/clientHandler');
window.etherUnits = require('./libs/etherUnits');
window.BigNumber = require('bignumber.js');
var angularApprovalHandler = require('./libs/angularApprovalHandler');
window.angularApprovalHandler = new angularApprovalHandler();
var blockies = require('./staticJS/blockies');
var blockiesDrtv = require('./directives/blockiesDrtv');
var configCtrl = require('./controllers/configCtrl');

var app = angular.module('mewifyApp', []);
app.directive('blockieAddress', blockiesDrtv);

app.controller('configCtrl', ['$scope', configCtrl]);
