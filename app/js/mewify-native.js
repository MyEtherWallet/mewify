const os = require('os');
var nwGui = require('nw.gui');
nwGui.setAlwaysOnTop = function(isOnTop) {
    nwGui.Window.get().setAlwaysOnTop(isOnTop);;
}
var fileIO = {};
fileIO.fs = require('fs');
fileIO.mkdirp = require('mkdirp');
fileIO.readFile = function(path, callback) {
    this.fs.readFile(path, 'utf8', function(err, data) {
        if (err) {
            Events.Error(err);
            callback({ error: true, msg: err, data: '' });
        } else
            callback({ error: false, msg: '', data: data });
    });
}
fileIO.readAllFiles = function(dirname, onFileContent, onError) {
    var _this = this;
    _this.fs.readdir(dirname, function(err, filenames) {
        if (err) {
            onError(err);
            return;
        }
        if (!filenames.length) onFileContent('', '', true);
        filenames.forEach(function(filename, id) {
            _this.fs.readFile(dirname + filename, 'utf-8', function(err, content) {
                if (err) {
                    onError(err);
                    return;
                }
                onFileContent(dirname + filename, content, id == filenames.length - 1);
            });
        });
    });
}
fileIO.writeFile = function(path, data, callback) {
    this.fs.writeFile(path, data, 'utf8', function(err) {
        if (err)
            callback({ error: true, msg: err, data: '' });
        else
            callback({ error: false, msg: '', data: true });
    });
}
fileIO.makeDirs = function(path, callback) {
    this.mkdirp(path, function(err) {
        if (err)
            callback({ error: true, msg: err, data: false });
        else
            callback({ error: false, msg: '', data: true });
    });
}
fileIO.existsSync = function(path) {
    return this.fs.existsSync(path);
}
fileIO.deleteFileSync = function(path) {
    if (this.existsSync(path)) this.fs.unlinkSync(path);
}

var Events = {};
Events.notifier = require('node-notifier');
Events.Error = function(msg) {
    console.error(msg);
    Events.notifier.notify({
        'title': 'Mewify - Error',
        'message': msg,
        'icon': '../images/icon.png',
        'sound': true
    });
}
Events.Info = function(msg) {
    console.log(msg);
    Events.notifier.notify({
        'title': 'Mewify - Info',
        'message': msg,
        'icon': '../images/icon.png',
        'sound': true
    });
}
var netIO = {};
netIO.net = require('net');
netIO.request = require('request');
netIO.http = require('http');
netIO.https = require('https');
netIO.express = require('express');
netIO.pem = require('pem');
netIO.bodyParser = require('body-parser');
netIO.openURL = require("open");

var ethUtil = require('ethereumjs-util');
ethUtil.crypto = require('crypto');
ethUtil.Wallet = require('ethereumjs-wallet');
ethUtil.Tx = require('ethereumjs-tx');
window.ethUtil = ethUtil;

var gulp = require('gulp');
gulp.task('reload', function() {
    if (location && location.reload) location.reload();
});
gulp.watch('./app/js/mewify-master.min.js', ['reload']);
gulp.watch('./app/js/mewify-native.min.js', ['reload']);
gulp.watch('./app/css/mewify-master.min.css', ['reload']);
gulp.watch('./app/index.htmk', ['reload']);

