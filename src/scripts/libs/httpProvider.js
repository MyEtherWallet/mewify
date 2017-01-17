"use strict";
var rpcClient = require('./rpcClient');
var rpcHandler = require('./rpcHandler');
var httpProvider = function(httpPort, httpsPort) {
	this.rpcClient = new rpcClient(configs.getNodeUrl());
	var _this = this;
    var app = netIO.express();
    app.use(netIO.bodyParser.json());
    var _this = this;
    app.post('/', function(req, res) {
    	res.connected = true;
        res.connType = "http";
        new rpcHandler(res, _this.rpcClient).sendResponse(req.body);
    });
    try {
        _this.httpServer = netIO.http.createServer(app);
        _this.httpServer.listen(httpPort);
        console.log("http server started");
    } catch (e) {
        console.log(e);
        Events.Error(e.message);
    }
    var startSSL = function(keys) {
        try {
            _this.httpsServer = netIO.https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app);
            _this.httpsServer.listen(httpsPort);
            console.log("https server started");
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
                startSSL(sslkey);
            }
        });
    } else {
        netIO.pem.createCertificate({ days: 3650, selfSigned: true }, function(err, keys) {
            fileIO.writeFile(sslKeyPath, JSON.stringify(keys, null, 4), function(resp) {
                if (resp.error) Events.Error(resp.msg);
            });
            startSSL(keys);
        });
    }

}
httpProvider.prototype.disconnect = function() {
    if (this.httpServer) this.httpServer.close();
    console.log("http server closed");
    if (this.httpsServer) this.httpsServer.close();
    console.log("https server closed");
}

module.exports = httpProvider;
