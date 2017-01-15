"use strict";
var privMethodHandler = function(server) {
    var _this = this;
    this.server = server;
    this.accounts = [];
    this.handleMethods = {
        "eth_accounts": 'ethAccounts',
        "personal_listAccounts": 'ethAccounts',
        "eth_coinbase": 'ethCoinbase',
        "personal_signAndSendTransaction": 'signAndSendTransaction'
    }
    _this.ethAccounts('', function() {});
}
privMethodHandler.prototype.handle = function(method, params, callback) {
    this[this.handleMethods[method]](params, callback);
}
privMethodHandler.prototype.ethCoinbase = function(params, callback) {
    var _this = this;
    if (_this.accounts.length) callback(privMethodHandler.getCallbackObj(false, '', _this.accounts[0].address));
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
    if (_this.accounts.length) {
        var output = [];
        _this.accounts.forEach(function(account) {
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
                _this.accounts = tempAccounts;
                if (_this.accounts.length) _this.ethAccounts(params, callback);
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
    _this.accounts.forEach(function(account) {
        if (account.address == params[0].from) {
            fileIO.readFile(account.path, function(data) {
                if (data.error) callback(data);
                else {
                    try {
                        var tempWallet = ethUtil.Wallet.fromV3(data.data, params[1], true);
                        _this.server.getResponse({ "jsonrpc": "2.0", "method": "eth_getTransactionCount", "params": [params[0].from, 'latest'], "id": privMethodHandler.getRandomId() }, function(data) {
                            if (data.error) callback(privMethodHandler.getCallbackObj(true, data.error.message, ''));
                            else {
                                params[0].nonce = data.result;
                                params[0].chainId = configs.getNodeChainId();
                                console.log(params[0]);
                                var tx = new ethUtil.Tx(params[0]);
                                tx.sign(tempWallet.getPrivateKey());
                                var rawTx = tx.serialize().toString('hex');
                                console.log(rawTx);
                                _this.server.getResponse({ "jsonrpc": "2.0", "method": "eth_sendRawTransaction", "params": ['0x' + rawTx], "id": privMethodHandler.getRandomId() }, function(data) {
                                    console.log(data);
                                    if (data.error) callback(privMethodHandler.getCallbackObj(true, data.error.message, ''));
                                    else callback(privMethodHandler.getCallbackObj(false, '', data.result));
                                });
                            }
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
module.exports = privMethodHandler;
