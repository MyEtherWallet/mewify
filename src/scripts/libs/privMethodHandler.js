"use strict";
var privMethodHandler = function(server) {
    var _this = this;
    this.server = server;
    this.handleMethods = {
        "eth_accounts": 'ethAccounts',
        "personal_listAccounts": 'ethAccounts',
        "eth_coinbase": 'ethCoinbase',
        "personal_signAndSendTransaction": 'signAndSendTransaction',
        "personal_sendTransaction": 'signAndSendTransaction',
        "eth_sendTransaction": 'signAndSendTransaction',
        "personal_newAccount": "personalNewAccount",
        "eth_sign": "ethSign",
        "personal_sign": "ethSign",
        "rpc_modules": "rpcModules"
    }
    _this.ethAccounts('', function() {});
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
var decryptAndSignTx = function(cont, tx, uiTx, server, callback) {
    try {
        tx.sign(ethUtil.Wallet.fromV3(cont, uiTx.pass, true).getPrivateKey());
        var rawTx = tx.serialize().toString('hex');
        server.getResponse({ "jsonrpc": "2.0", "method": "eth_sendRawTransaction", "params": ['0x' + rawTx], "id": privMethodHandler.getRandomId() }, function(data) {
            if (data.error) {
                callback(privMethodHandler.getCallbackObj(true, data.error.message, ''));
                uiTx.callback(privMethodHandler.getCallbackObj(true, data.error.message, ''));
            } else {
                callback(privMethodHandler.getCallbackObj(false, '', data.result));
                uiTx.callback(privMethodHandler.getCallbackObj(false, '', data.result));
            }
        });
    } catch (err) {
        Events.Error(err.message);
        callback(privMethodHandler.getCallbackObj(true, err.message, []));
        uiTx.callback(privMethodHandler.getCallbackObj(true, err.message, []));
    }
}
privMethodHandler.prototype.signAndSendTransaction = function(params, callback) {
    var _this = this;
    if (!params[1]) params[1] = '';
    var accountFound = false;
    privMethodHandler.accounts.forEach(function(account) {
        if (accountFound) return;
        if (account.address == params[0].from.toLowerCase()) {
            accountFound = true;
            fileIO.readFile(account.path, function(fCont) {
                if (fCont.error) callback(fCont);
                else {
                    _this.server.getResponse({ "jsonrpc": "2.0", "method": "eth_getTransactionCount", "params": [params[0].from, 'latest'], "id": privMethodHandler.getRandomId() }, function(data) {
                        if (data.error) callback(privMethodHandler.getCallbackObj(true, data.error.message, ''));
                        else {
                            params[0].nonce = data.result;
                            params[0].chainId = configs.getNodeChainId();
                            var tx = new ethUtil.Tx(params[0]);
                            var tempTx = { to: params[0].to, from: params[0].from, value: etherUnits.toEther(params[0].value, 'wei'), pass: params[1] };
                            angularApprovalHandler.showTxConfirm(tempTx, function(data) {
                                if (data.error) callback(data);
                                else {
                                    decryptAndSignTx(fCont.data, tx, tempTx, _this.server, callback);
                                }
                            });
                        }
                    });
                }
            });
        }
        //break;
    });
    if (!accountFound) callback(privMethodHandler.getCallbackObj(true, 'Account not found', ''));
}
var decryptAndSignData = function(cont, uiTx, callback) {
    try {
        var signed = ethUtil.ecsign(uiTx.data, ethUtil.Wallet.fromV3(cont, uiTx.pass, true).getPrivateKey());
        var combined = Buffer.concat([Buffer.from(signed.r), Buffer.from(signed.s), Buffer.from([signed.v])]);
        var combinedHex = combined.toString('hex');
        callback(privMethodHandler.getCallbackObj(false, '', '0x' + combinedHex));
        uiTx.callback(privMethodHandler.getCallbackObj(false, '', '0x' + combinedHex));
    } catch (err) {
        Events.Error(err.message);
        callback(privMethodHandler.getCallbackObj(true, err.message, []));
        uiTx.callback(privMethodHandler.getCallbackObj(true, err.message, []));
    }
}
privMethodHandler.prototype.ethSign = function(params, callback) {
    var _this = this;
    var accountFound = false;
    if (!params[2]) params[2] = '';
    privMethodHandler.accounts.forEach(function(account) {
        if (accountFound) return;
        if (account.address == params[0].toLowerCase()) {
            accountFound = true;
            fileIO.readFile(account.path, function(fCont) {
                if (fCont.error) callback(fCont);
                else {
                    var dataBuf = new Buffer(params[1].replace('0x', ''), 'hex');
                    var data = "\x19Ethereum Signed Message:\n" + dataBuf.length + dataBuf;
                    var tempTx = { from: params[0], data: ethUtil.sha3(data), string: data, pass: params[2] };
                    angularApprovalHandler.showSignConfirm(tempTx, function(data) {
                        if (data.error) callback(data);
                        else {
                            decryptAndSignData(fCont.data, tempTx, callback);
                        }
                    });
                }
            });
        }
        //break;
    });
    if (!accountFound) callback(privMethodHandler.getCallbackObj(true, 'Account not found', ''));
}
privMethodHandler.getCallbackObj = function(isError, msg, data) {
    return { error: isError, msg: msg, data: data };
}
privMethodHandler.sanitizeAddress = function(address) {
    address = address.substring(0, 2) == '0x' ? address.substring(2) : address;
    return '0x' + address.toLowerCase();
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
