(function(module) {
    module.controller('footerController', ['$state', '$scope', function($state, $scope) {
        $scope.cdate = new Date();
    }]);
}(angular.module("ace.common")));
