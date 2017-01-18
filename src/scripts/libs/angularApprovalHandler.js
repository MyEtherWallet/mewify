"use strict";
var angularApprovalHandler = function() {}
angularApprovalHandler.prototype.setScope = function(scope) {
    this.scope = scope;
    this.scope.isTxConfirmActive = false;
    this.allDivs = ['showInitDiv', 'showConfirmTxDiv', 'showTxResultDiv'];
}
angularApprovalHandler.prototype.removeScope = function() {
    this.scope = null;
}
angularApprovalHandler.prototype.showDiv = function(name) {
    var _this = this;
    this.allDivs.forEach(function(div) {
        _this.scope[div] = div == name ? true : false;
    });
}
angularApprovalHandler.prototype.showTxConfirm = function(tx, callback) {
    var _this = this;
    if (_this.scope.isTxConfirmActive) {
        callback({ error: true, msg: 'Transaction denied - waiting for approval on another tx', data: false });
        return;
    }
    _this.scope.isTxConfirmActive = true;
    this.showDiv('showConfirmTxDiv');
    tx.responseSent = false;
    tx.approve = function() {
        nwGui.setAlwaysOnTop(false);
        _this.showDiv('showTxResultDiv');
        _this.scope.isTxConfirmActive = false;
        tx.responseSent = true;
        if (!_this.scope.$$phase) _this.scope.$apply();
        callback({ error: false, msg: '', data: true });
    }
    tx.deny = function() {
        nwGui.setAlwaysOnTop(false);
        _this.showDiv('showInitDiv');
        _this.scope.isTxConfirmActive = false;
        tx.responseSent = true;
        if (!_this.scope.$$phase) _this.scope.$apply();
        callback({ error: true, msg: 'Transaction denied', data: false });
    }
    tx.callback = function(data) {
        tx.error = data.error;
        tx.msg = data.msg;
        tx.hash = data.data;
        if (!_this.scope.$$phase) _this.scope.$apply();
    }
    tx.backHome = function() {
        _this.showDiv('showInitDiv');
        if (!_this.scope.$$phase) _this.scope.$apply();
    }
    this.scope.tx = tx;
    if (!this.scope.$$phase) this.scope.$apply();
    nwGui.setAlwaysOnTop(true);
    setTimeout(function() {
        if (!_this.scope.tx.responseSent) tx.deny();
    }, 30000);
}
module.exports = angularApprovalHandler;
