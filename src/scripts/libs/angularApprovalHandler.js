"use strict";
var angularApprovalHandler = function() {}
angularApprovalHandler.prototype.setScope = function(scope) {
    this.scope = scope;
}
angularApprovalHandler.prototype.removeScope = function() {
    this.scope = null;
}
angularApprovalHandler.prototype.showHideDiv = function(name, show) {
    this.scope.showInitDiv = !show;
    this.scope[name] = show;
}
angularApprovalHandler.prototype.showTxConfirm = function(tx, callback) {
	var _this = this;
    this.showHideDiv('showConfirmTxDiv', true);
    tx.approve = function() {
        nwGui.setAlwaysOnTop(false);
        _this.showHideDiv('showConfirmTxDiv', false);
        callback({ error: false, msg: '', data: true });
    }
    tx.deny = function() {
        nwGui.setAlwaysOnTop(false);
        _this.showHideDiv('showConfirmTxDiv', false);
        callback({ error: true, msg: 'Transaction denied', data: false });
    }
    this.scope.tx = tx;
    if (!this.scope.$$phase) this.scope.$apply();
    nwGui.setAlwaysOnTop(true);
}
module.exports = angularApprovalHandler;
