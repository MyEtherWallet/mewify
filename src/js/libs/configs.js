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
configs.getKeysPath = function() {
    return configs.default.keystore[configs.platform];
};
module.exports = configs;
