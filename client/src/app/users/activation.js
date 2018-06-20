(function(module) {
    module.controller('userActivationController', ['$state', '$window', '$scope', 'UserActivation', 'SessionService', '$rootScope', '$location', 'flash', '$filter', 'TokenServiceData', function($state, $window, $scope, UserActivation, SessionService, $rootScope, $location, flash, $filter, TokenServiceData) {
        var element = {};
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("User Activation");
        element.id = $state.params.id;
        element.hash = $state.params.hash;
        element.token = $state.params.ex_token;
        UserActivation.activation(element, function(response) {
            $scope.response = response;
            if (!angular.isUndefined($scope.response.error) && $scope.response.error.code === 0) {
                flashMessage = $filter("translate")("Your account has been activated. Please login to continue.");
                flash.set(flashMessage, 'success', false);
                $location.url('/users/login');
            } else if ($scope.response.error.code === 1) {
                errorMsg = $filter("translate")("Invalid request");
                flash.set(errorMsg, 'error', false);
                $location.url('/users/login');
            } else {
                errorMsg = $filter("translate")($scope.response.error.message);
                flash.set(errorMsg, 'error', false);
                $location.url('/users/login');
            }
        });
    }]);
}(angular.module("ace.users")));
