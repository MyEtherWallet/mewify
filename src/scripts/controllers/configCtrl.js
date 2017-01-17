'use strict';
var configCtrl = function($scope) {
    configs.init(function() {
        $scope.configs = configs;
        $scope.clientConfig = $scope.configs.default;
        $scope.clientConfigStr = JSON.stringify($scope.clientConfig);
        if (!$scope.$$phase) $scope.$apply();
    });
    $scope.showSave = $scope.showConfirmTxDiv = $scope.showStop = $scope.disableForm = false;
    $scope.showInitDiv = $scope.showStart = true;
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
            angularApprovalHandler.setScope($scope);
        }
    }
    $scope.stop = function() {
        if ($scope.clientHandler) {
            $scope.clientHandler.disconnect();
            $scope.showStart = true;
            $scope.showStop = false;
            $scope.clientHandler = null;
            $scope.disableForm = false;
            angularApprovalHandler.removeScope();
        }
    }
};
module.exports = configCtrl;
