var configCtrl = require('./scripts/controllers/configCtrl');
var app = angular.module('mewifyApp', []);
app.controller('configCtrl', ['$scope', configCtrl]);