"use strict";
var privMethodHandler = function(server) {
    var _this = this;
    this.server = server;
    this.handleMethods = {
        "eth_accounts": 'ethAccounts',
        "personal_listAccounts": 'ethAccounts',
        "eth_coinbase": 'ethCoinbase',
        "personal_signAndSendTransaction": 'signAndSendTransaction',
        "personal_newAccount": "personalNewAccount"
    }
    _this.ethAccounts('', function() {});
}
privMethodHandler.accounts = [];
privMethodHandler.prototype.handle = function(method, params, callback) {
    this[this.handleMethods[method]](params, callback);
}
privMethodHandler.prototype.personalNewAccount = function(params, callback) {
    console.log(params);
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
