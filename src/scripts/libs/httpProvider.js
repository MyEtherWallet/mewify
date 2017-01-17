"use strict";
var rpcClient = require('./rpcClient');
var rpcHandler = require('./rpcHandler');
var httpProvider = function(httpPort, httpsPort) {
    this.rpcClient = new rpcClient(configs.getNodeUrl());
    var _this = this;
    var app = netIO.express();
    app.use(netIO.bodyParser.json());
    var _this = this;
    this.openSockets = {};
    var nextSocketId = 0;
    app.all('*', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    });
    app.post('/', function(req, res) {
        res.connected = true;
        res.connType = "http";
        new rpcHandler(res, _this.rpcClient).sendResponse(req.body);
    });
    var onConnection = function(socket) {
        var socketId = nextSocketId;
        console.log('socket', socketId, 'opened');
        _this.openSockets[socketId] = socket;
        nextSocketId++;
        socket.on('close', function() {
            console.log('socket', socketId, 'closed');
            delete _this.openSockets[socketId];
        });
    }
    try {
        _this.httpServer = netIO.http.createServer(app);
        _this.httpServer.listen(httpPort, function() {
            console.log("http server started");
        });
        _this.httpServer.on('connection', onConnection);
    } catch (e) {
        console.log(e);
        Events.Error(e.message);
    }
    var startSSL = function(keys) {
        try {
            var httpsServer = netIO.https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app);
            httpsServer.listen(httpsPort, function() {
                console.log("https server started");
            });
            httpsServer.on('connection', onConnection);
            return httpsServer;
        } catch (e) {
            console.log(e);
            Events.Error(e.message);
        }
    }
    var sslKeyPath = configs.getConfigDir() + 'ssl_key';
    if (fileIO.existsSync(sslKeyPath)) {
        fileIO.readFile(sslKeyPath, function(data) {
            if (data.error) Events.Error(data.msg);
            else {
                var sslkey = JSON.parse(data.data);
                _this.httpsServer = startSSL(sslkey);
            }
        });
    } else {
        netIO.pem.createCertificate({ days: 10, selfSigned: true }, function(err, keys) {
            fileIO.writeFile(sslKeyPath, JSON.stringify(keys, null, 4), function(resp) {
                if (resp.error) Events.Error(resp.msg);
            });
            _this.httpsServer = startSSL(sslkey);
        });
    }

}
httpProvider.prototype.disconnect = function() {
    if (this.httpServer) this.httpServer.close(function() {
        console.log("http server closed");
    });
    if (this.httpsServer) this.httpsServer.close(function() {
        console.log("https server closed");
    });
    for (var socketId in this.openSockets) {
        console.log('socket', socketId, 'destroyed');
        this.openSockets[socketId].destroy();
        delete this.openSockets[socketId];
    }
}

module.exports = httpProvider;
