(function(module) {
    module.controller('changePasswordController', ['$state', '$window', '$scope', 'SessionService', '$rootScope', '$location', 'flash', '$filter', '$modal', 'ChangePassword', 'TokenServiceData', function($state, $window, $scope, SessionService, $rootScope, $location, flash, $filter, $modal, ChangePassword, TokenServiceData) {
        $scope.user = {};
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Change Password");
        $scope.change_password = function(changePasswordForm, user) {
            $scope.user = user;
            $scope.disableButton = true;
            if (changePasswordForm) {
                ChangePassword.change_password($scope.user, function(response) {
                    if (response.error.code === 0) {
                        successMsg = $filter("translate")("Password Changed Successfully.");
                        flash.set(successMsg, 'success', false);
                        $scope.user = {};
                    } else if (response.error.code === 1) {
                        errrorMsg = $filter("translate")("Your current password was incorrect.");
                        flash.set(errrorMsg, 'error', false);
                    } else {
                        flash.set(response.error.message, 'error', false);
                    }
                    $scope.disableButton = false;
                });
            }
        };

    }]);
}(angular.module("ace.users")));
