var angular = require('angular');
var configCtrl = require('./controllers/configCtrl');

var app = angular.module('mewifyApp', []);
app.controller('configCtrl', ['$scope', configCtrl]);
