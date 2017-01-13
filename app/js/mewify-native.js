var fileIO = {};
fileIO.fs = require('fs');
fileIO.readFile = function(path, callback) {
    this.fs.readFile(path, 'utf8', function(err, data) {
        if (err) {
            callback({ error: true, msg: err, data: '' });
        }
        callback({ error: false, msg: '', data: data });
    });
}
fileIO.writeFile = function(path, data, callback) {
    this.fs.writeFile(path, data, 'utf8', function(err) {
        if (err) {
            callback({ error: true, msg: err, data: '' });
        }
        callback({ error: false, msg: '', data: true });
    });
}
fileIO.existsSync = function(path) {
	return this.fs.existsSync(path);
}
fileIO.deleteFileSync = function(path) {
	if(this.existsSync(path)) this.fs.unlinkSync(path);
}

var Events = {};
Events.Error = function(msg) {
	console.error(msg);
}
Events.Info = function(msg) {
	console.log(msg);
}

var netIO = {};
netIO.net = require('net');
netIO.request = require('request');
var gulp = require('gulp');
gulp.task('reload', function() {
    if (location && location.reload) location.reload();
});
gulp.watch('./app/js/mewify-master.min.js', ['reload']);
gulp.watch('./app/js/mewify-native.min.js', ['reload']);

