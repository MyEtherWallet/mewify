'use strict';
var configCtrl = function($scope) {
    $scope.clientConfig = configs.default;
    $scope.clientConfigStr = JSON.stringify($scope.clientConfig);
    $scope.showSave = false;
    $scope.showStart = true;
    $scope.showStop = false;
    $scope.ipcProvider = null;
    $scope.$watch('clientConfig', function() {
        if (JSON.stringify($scope.clientConfig) != $scope.clientConfigStr)
            $scope.showSave = true;
        else
            $scope.showSave = false;
    }, true);
    $scope.saveConfig = function() {
        fileIO.writeFile(configs.paths.configFile, JSON.stringify($scope.clientConfig, null, 4), function(resp) {
            if (resp.error)
                Events.Error(resp.msg);
            else {
                $scope.clientConfigStr = JSON.stringify($scope.clientConfig);
                $scope.showSave = false;
                if (!$scope.$$phase) $scope.$apply();
            }
        });
    }
    $scope.start = function () {
    	if(!$scope.ipcProvider) {
    		fileIO.deleteFileSync($scope.clientConfig.ipc.linux);
    		$scope.ipcProvider = new ipcProvider($scope.clientConfig.ipc.linux, netIO.net);
    		$scope.showStart = false;
    		$scope.showStop = true;
    	}
    }
    $scope.stop = function () {
    	if($scope.ipcProvider) {
    		$scope.ipcProvider.disconnect();
    		$scope.showStart = true;
    		$scope.showStop = false;
    		$scope.ipcProvider = null;
    	}
    }
};
module.exports = configCtrl;
