var angular = require('angular');
var configs = require('./libs/configs');
window.configs = configs;
/*var ipcProvider = require('./libs/ipcProvider');
window.ipcProvider = ipcProvider;
var rpcClient = require('./libs/rpcClient');
window.rpcClient = rpcClient;
var rpcHandler = require('./libs/rpcHandler');
window.rpcHandler = rpcHandler;
var privMethodHandler = require('./libs/privMethodHandler');
window.privMethodHandler = privMethodHandler;
var parityOutputProcessor = require('./libs/parityOutputProcessor');
window.parityOutputProcessor = parityOutputProcessor;*/
var clientHandler = require('./libs/clientHandler');
window.clientHandler = clientHandler;
var configCtrl = require('./controllers/configCtrl');

var app = angular.module('mewifyApp', []);
app.controller('configCtrl', ['$scope', configCtrl]);

'use strict';
var configCtrl = function($scope) {
    configs.init(function() {
        $scope.configs = configs;
        $scope.clientConfig = $scope.configs.default;
        $scope.clientConfigStr = JSON.stringify($scope.clientConfig);
        if (!$scope.$$phase) $scope.$apply();
    });
    $scope.showSave = false;
    $scope.showStart = true;
    $scope.showStop = false;
    $scope.disableForm = false;
    $scope.clientHandler = null;
    $scope.$watch('clientConfig', function() {
        if (JSON.stringify($scope.clientConfig) != $scope.clientConfigStr)
            $scope.showSave = true;
        else
            $scope.showSave = false;
    }, true);
    $scope.saveConfig = function() {
        fileIO.writeFile(configs.getConfigPath(), JSON.stringify($scope.clientConfig, null, 4), function(resp) {
            if (resp.error)
                Events.Error(resp.msg);
            else {
                $scope.clientConfigStr = JSON.stringify($scope.clientConfig);
                $scope.showSave = false;
                if (!$scope.$$phase) $scope.$apply();
            }
        });
    }
    $scope.start = function() {
        if (!$scope.clientHandler) {
            $scope.clientHandler = new clientHandler($scope.clientConfig.ipc[$scope.configs.platform], $scope.clientConfig.httpPort, $scope.clientConfig.httpsPort);
            $scope.showStart = false;
            $scope.showStop = true;
            $scope.disableForm = true;
        }
    }
    $scope.stop = function() {
        if ($scope.clientHandler) {
            $scope.clientHandler.disconnect();
            $scope.showStart = true;
            $scope.showStop = false;
            $scope.clientHandler = null;
            $scope.disableForm = false;
        }
    }
};
module.exports = configCtrl;

"use strict";
var ipcProvider = require('./ipcProvider');
var httpProvider = require('./httpProvider');
var clientHandler = function(path, httpPort, httpsPort) {
    fileIO.deleteFileSync(path);
    this.ipcProvider = new ipcProvider(path, netIO.net);
    this.httpProvider = new httpProvider(httpPort, httpsPort);
}
clientHandler.prototype.disconnect = function(){
    this.ipcProvider.disconnect();
    this.httpProvider.disconnect();
}
module.exports = clientHandler;

"use strict";
var configs = function() {}
configs.init = function(callback) {
    var _this = this;
    this.platform = os.platform();
    this.homeDir = os.homedir();
    var defaultVal = require('../../../configs/default.json');
    defaultVal.configDir[this.platform] = defaultVal.configDir[this.platform].replace('[[HOME_DIR]]', this.homeDir);
    defaultVal.ipc[this.platform] = defaultVal.ipc[this.platform].replace('[[HOME_DIR]]', this.homeDir);
    defaultVal.keystore[this.platform] = defaultVal.keystore[this.platform].replace('[[HOME_DIR]]', this.homeDir);
    this.paths = {};
    this.paths.configFile = defaultVal.configDir[this.platform] + 'conf.json';
    if (fileIO.existsSync(this.paths.configFile)) {
        fileIO.readFile(this.paths.configFile, function(data) {
            if (data.error) Events.Error(data.msg);
            else {
                _this.default = JSON.parse(data.data);
                if (callback) callback();
            }
        });
    } else {
        fileIO.makeDirs(defaultVal.configDir[this.platform], function(data) {
            if (!data.error) {
                fileIO.writeFile(_this.paths.configFile, JSON.stringify(defaultVal, null, 4), function(resp) {
                    if (resp.error)
                        Events.Error(resp.msg);
                    else {
                        _this.default = defaultVal;
                        fileIO.makeDirs(_this.default.keystore[_this.platform], function() {});
                        if (callback) callback();
                    }
                });
            } else Events.Error(data.msg);
        });

    }
}
configs.getConfigPath = function() {
    return configs.default.configDir[configs.platform] + 'conf.json';
};
configs.getConfigDir = function() {
    return configs.default.configDir[configs.platform];
};
configs.getKeysPath = function() {
    return configs.default.keystore[configs.platform];
};
configs.getNodeUrl = function() {
    return JSON.parse(configs.default.node).url;
};
configs.getNodeName = function() {
    return JSON.parse(configs.default.node).name;
};
configs.getNodeChainId = function() {
    return JSON.parse(configs.default.node).chainId;
};
module.exports = configs;

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

"use strict";
var rpcClient = require('./rpcClient');
var rpcHandler = require('./rpcHandler');
var IpcProvider = function(path, net) {
    var _this = this;
    this.responseCallbacks = {};
    this.path = path;
    this.clients = [];
    this.rpcClient = new rpcClient(configs.getNodeUrl());
    this.server = net.createServer(function(client) {
        console.log("new Client! Total Clients: " + _this.clients.length);
        Events.Info("new Client! Total Clients: " + _this.clients.length);
        client.connected = true;
        client.connType = "ipc";
        client.rpcHandler = new rpcHandler(client, _this.rpcClient);
        client.on('data', function(data) {
            _this._parseResponse(data.toString()).forEach(function(result) {
                client.rpcHandler.sendResponse(result);
            });
        });
        client.on('end', function() {
            client.connected = false;
            _this.clients.splice(_this.clients.indexOf(client), 1);
        });
        _this.clients.push(client);
    });
    this.server.on('listening', function() {
        console.log('Connection started');
    });
    this.server.on('close', function(e) {
        console.log('Connection closed');
    });
    this.server.on('error', function(e) {
        console.error('IPC Connection Error', e);
    });
    this.server.listen({ path: this.path });
};

IpcProvider.prototype._parseResponse = function(data) {
    var _this = this,
        returnValues = [];

    // DE-CHUNKER
    var dechunkedData = data
        .replace(/\}[\n\r]?\{/g, '}|--|{') // }{
        .replace(/\}\][\n\r]?\[\{/g, '}]|--|[{') // }][{
        .replace(/\}[\n\r]?\[\{/g, '}|--|[{') // }[{
        .replace(/\}\][\n\r]?\{/g, '}]|--|{') // }]{
        .split('|--|');
    dechunkedData.forEach(function(data) {
        if (_this.lastChunk)
            data = _this.lastChunk + data;
        var result = null;
        try {
            result = JSON.parse(data);
        } catch (e) {
            _this.lastChunk = data;
            return;
        }
        if (result)
            returnValues.push(result);
    });
    return returnValues;
};

IpcProvider.prototype.isConnected = function() {
    return this.server.listening;
};

IpcProvider.prototype.disconnect = function() {
    this.server.close();
};

IpcProvider.prototype.send = function(payload) {
    this.connection.write(JSON.stringify(payload));
};

module.exports = IpcProvider;

"use strict";
var parityOutputProcessor = function() {
    this.processMethods = {
        "eth_getTransactionReceipt": "ethGetTransactionReceipt"
    };
    this.queue = {};
}
parityOutputProcessor.prototype.preProcess = function(req) {;
    var _this = this;
    if (Array.isArray(req)) {
        req.forEach(function(obj) {
            if (_this.processMethods[obj.method]) {
                _this.queue[obj.id] = _this.processMethods[obj.method];
            }
        });
    } else if (_this.processMethods[req.method]) {
        _this.queue[req.id] = _this.processMethods[req.method];
    }
}
parityOutputProcessor.prototype.postProcess = function(resp) {
    var _this = this;
    if (Array.isArray(resp)) {
        resp.forEach(function(obj) {
            if (_this.queue[obj.id]) {
                obj = parityOutputProcessor[_this.queue[obj.id]](obj);
                delete _this.queue[obj.id];
            }
        });
    } else if (_this.queue[resp.id]) {
        resp = parityOutputProcessor[_this.queue[resp.id]](resp);
        delete _this.queue[resp.id];
    }
    return resp;
}
parityOutputProcessor.ethGetTransactionReceipt = function(obj) {
    if (obj.result && !obj.result.blockNumber) obj.result = null;
    return obj;
}
module.exports = parityOutputProcessor;

"use strict";
var privMethodHandler = function(server) {
    var _this = this;
    this.server = server;
    this.handleMethods = {
            "eth_accounts": 'ethAccounts',
            "personal_listAccounts": 'ethAccounts',
            "eth_coinbase": 'ethCoinbase',
            "personal_signAndSendTransaction": 'signAndSendTransaction',
            "personal_newAccount": "personalNewAccount",
            "rpc_modules": "rpcModules"
        }
        //_this.ethAccounts('', function() {});
}
privMethodHandler.accounts = [];
privMethodHandler.prototype.handle = function(method, params, callback) {
    this[this.handleMethods[method]](params, callback);
}
privMethodHandler.prototype.rpcModules = function(params, callback) {
    callback(privMethodHandler.getCallbackObj(false, '', {
        "eth": "1.0",
        "net": "1.0",
        "parity": "1.0",
        "rpc": "1.0",
        "traces": "1.0",
        "web3": "1.0",
        "personal": "1.0"
    }));
}
privMethodHandler.prototype.personalNewAccount = function(params, callback) {
    var _this = this;
    try {
        var tempAccount = ethUtil.Wallet.generate();
        var fPath = configs.getKeysPath() + tempAccount.getV3Filename();
        fileIO.writeFile(fPath, tempAccount.toV3String(params[0]), function(data) {
            if (data.error) callback(privMethodHandler.getCallbackObj(true, data.msg, ''));
            else {
                privMethodHandler.accounts.push({ address: tempAccount.getAddressString(), path: fPath });
                callback(privMethodHandler.getCallbackObj(false, '', tempAccount.getAddressString()));
            }
        });
    } catch (e) {
        callback(privMethodHandler.getCallbackObj(true, e.message, ''));
    }
}
privMethodHandler.prototype.ethCoinbase = function(params, callback) {
    var _this = this;
    if (privMethodHandler.accounts.length) callback(privMethodHandler.getCallbackObj(false, '', privMethodHandler.accounts[0].address));
    else {
        this.ethAccounts('', function(data) {
            if (data.error) callback(data);
            else if (data.data.length) callback(privMethodHandler.getCallbackObj(false, '', data.data[0]));
            else callback(privMethodHandler.getCallbackObj(false, '', ''));;
        })
    }
}
privMethodHandler.prototype.ethAccounts = function(params, callback) {
    var _this = this;
    if (privMethodHandler.accounts.length) {
        var output = [];
        privMethodHandler.accounts.forEach(function(account) {
            output.push(account.address);
        });
        callback(privMethodHandler.getCallbackObj(false, '', output));
    } else {
        var tempAccounts = [];
        fileIO.readAllFiles(configs.getKeysPath(), function(fname, cont, isLast) {
            if (privMethodHandler.isJSON(cont) && JSON.parse(cont).address) {
                tempAccounts.push({ address: privMethodHandler.sanitizeAddress(JSON.parse(cont).address), path: fname });
            }
            if (isLast) {
                privMethodHandler.accounts = tempAccounts;
                if (privMethodHandler.accounts.length) _this.ethAccounts(params, callback);
                else callback(privMethodHandler.getCallbackObj(false, '', []));
            }
        }, function(err) {
            Events.Error(err);
            callback(privMethodHandler.getCallbackObj(true, err, []));
        });
    }
}
privMethodHandler.prototype.signAndSendTransaction = function(params, callback) {
    var _this = this;
    privMethodHandler.accounts.forEach(function(account) {
        if (account.address == params[0].from) {
            fileIO.readFile(account.path, function(fCont) {
                if (fCont.error) callback(fCont);
                else {
                    _this.server.getResponse({ "jsonrpc": "2.0", "method": "eth_getTransactionCount", "params": [params[0].from, 'latest'], "id": privMethodHandler.getRandomId() }, function(data) {
                        if (data.error) callback(privMethodHandler.getCallbackObj(true, data.error.message, ''));
                        else {
                            try {
                                params[0].nonce = data.result;
                                params[0].chainId = configs.getNodeChainId();
                                var tx = new ethUtil.Tx(params[0]);
                                tx.sign(ethUtil.Wallet.fromV3(fCont.data, params[1], true).getPrivateKey());
                                var rawTx = tx.serialize().toString('hex');
                                _this.server.getResponse({ "jsonrpc": "2.0", "method": "eth_sendRawTransaction", "params": ['0x' + rawTx], "id": privMethodHandler.getRandomId() }, function(data) {
                                    if (data.error) callback(privMethodHandler.getCallbackObj(true, data.error.message, ''));
                                    else callback(privMethodHandler.getCallbackObj(false, '', data.result));
                                });
                            } catch (err) {
                                Events.Error(err.message);
                                callback(privMethodHandler.getCallbackObj(true, err.message, []));
                            }
                        }
                    });
                }
            });
        }
    });

}
privMethodHandler.getCallbackObj = function(isError, msg, data) {
    return { error: isError, msg: msg, data: data };
}
privMethodHandler.sanitizeAddress = function(address) {
    address = address.substring(0, 2) == '0x' ? address.substring(2) : address;
    return '0x' + address;
}
privMethodHandler.isJSON = function(json) {
    try {
        JSON.parse(json);
    } catch (e) {
        return false;
    }
    return true;
}
privMethodHandler.getRandomId = function() {
    return ethUtil.crypto.randomBytes(16).toString('hex');
}
privMethodHandler.updataAccounts = false;
module.exports = privMethodHandler;

"use strict";
var parityOutputProcessor = require('./parityOutputProcessor');
var rpcClient = function(server) {
    this.server = server;
    this.request = netIO.request.defaults({ jar: true });
    this.parityOutputProcessor = new parityOutputProcessor();
}
rpcClient.prototype.call = function(body, callback) {
    var _this = this;
    _this.request({
        url: _this.server,
        method: "POST",
        json: true,
        body: body
    }, function(error, response, body) {
        callback(error, response, body);
    });
}
rpcClient.prototype.getResponse = function(body, callback) {
    var _this = this;
    _this.parityOutputProcessor.preProcess(body);
    _this.call(body, function(err, res, body) {
        if (err) Events.Error(err);
        else {
            body = _this.parityOutputProcessor.postProcess(body);
            callback(body);
        }
    });
}
module.exports = rpcClient;

"use strict";
var privMethodHandler = require('./privMethodHandler');
var rpcHandler = function(client, server) {
    this.client = client;
    this.server = server;
    this.privMethodHandler = new privMethodHandler(server);
}
rpcHandler.prototype.sendResponse = function(req) {
    console.log(req);
    var isArray = false;
    var _this = this;
    if (Array.isArray(req)) {
        isArray = true;
        for (var i in req) {
            if (req[i].method && !rpcHandler.isAllowedMethod(req[i].method)) {
                this.write(rpcHandler.getInvalidMethod(req[i].method, req[i].id));
                req.splice(i, 1);
            }
            if (req[i].method && rpcHandler.isPrivMethod(req[i].method)) {
                var handlePriv = function(treq) {
                    _this.privMethodHandler.handle(treq.method, treq.params, function(data) {
                        if (data.error) _this.write(rpcHandler.getErrorMsg(data.msg, treq.id))
                        else {
                            _this.write(rpcHandler.getResultMsg(data.data, treq.id));
                        }
                    });
                }
                handlePriv(req[i]);
                req.splice(i, 1);
            }
        }
    } else if (req.method && !rpcHandler.isAllowedMethod(req.method)) {
        this.write(rpcHandler.getInvalidMethod(req.method, req.id));
    } else if (!req.method) {
        this.write(rpcHandler.getInvalidMethod('Invalid number of input parameters', req.id));
    }
    if (Array.isArray(req)) {
        if (req.length)
            _this.server.getResponse(req, function(res) {
                _this.write(res);
            });
    } else {
        if (rpcHandler.isPrivMethod(req.method)) {
            _this.privMethodHandler.handle(req.method, req.params, function(data) {
                if (data.error) _this.write(rpcHandler.getErrorMsg(data.msg, req.id))
                else {
                    _this.write(rpcHandler.getResultMsg(data.data, req.id));
                }
            });
        } else {
            _this.server.getResponse(req, function(res) {
                _this.write(res);
            });
        }
    }
}
rpcHandler.prototype.write = function(data) {
    //console.log(data);
    var _this = this;
    if (_this.client.connected){
        console.log(data);
        if(_this.client.connType=="ipc") _this.client.write(JSON.stringify(data));
        else if(_this.client.connType=="http") _this.client.json(data);
    }
}
rpcHandler.getInvalidMethod = function(methodName, id) {
    Events.Error("{" + methodName + "} Method not found or unavailable");
    return { "jsonrpc": "2.0", "error": { "code": -32601, "message": "{" + methodName + "} Method not found or unavailable", "data": null }, "id": id };
}
rpcHandler.getErrorMsg = function(error, id) {
    Events.Error(error);
    return { "jsonrpc": "2.0", "error": { "code": -1, "message": error, "data": null }, "id": id };
}
rpcHandler.getResultMsg = function(result, id) {
    return { jsonrpc: "2.0", result: result, id: id };
}
rpcHandler.isPrivMethod = function(method) {
    return rpcHandler.privMethods.indexOf(method) > -1;
}
rpcHandler.isAllowedMethod = function(method) {
    return rpcHandler.remoteMethods.indexOf(method) > -1 || rpcHandler.isPrivMethod(method);
}
rpcHandler.remoteMethods = require('./methods/remoteMethods.json');
rpcHandler.privMethods = require('./methods/privMethods.json');
module.exports = rpcHandler;
