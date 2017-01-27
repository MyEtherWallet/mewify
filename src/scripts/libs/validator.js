'use strict';
var validator = function() {}
validator.isValidPort = function(value) {
    if (!value) return false;
    return !isNaN(parseFloat(value)) && isFinite(value) && parseFloat(value) >= 3000 && parseFloat(value) < 65536;
}
validator.isPortAvailable = function(port, callback) {
    var tester = netIO.net.createServer()
        .once('error', function(err) {
            callback(false)
        })
        .once('listening', function() {
            tester.once('close', function() { callback(true) })
                .close()
        }).listen(port);

}
validator.isValidDir = function(path) {
    if (!path) return false;
    return fileIO.fs.existsSync(path) && fileIO.fs.lstatSync(path).isDirectory();
}
validator.isValidIPC = function(path) {
    if (!path) return false;
    return validator.isValidDir(fileIO.path.dirname(path)) && fileIO.path.extname(path) == ".ipc";
}
module.exports = validator;
