(function(module) {
    module.controller('userLogoutController', ['$rootScope', '$scope', 'Logout', '$location', 'SessionService', 'flash', '$filter', 'GENERAL_CONFIG', 'TokenServiceData', function($rootScope, $scope, Logout, $location, SessionService, flash, $filter, GENERAL_CONFIG, TokenServiceData) {
        /**
         * @ngdoc controller
         * @name LogoutController
         * @description
         * User can logout from site, unset the session details and redirect to login page
         *
         *
         **/
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Logout");
        Logout.logout('', function(response) {
            $scope.response = response;
            $scope.title = 'Logout';
            if (!$scope.response.error) {
                $.get(GENERAL_CONFIG.api_url + 'api/v1/token.json', function(data) {
                    data = angular.fromJson(data);
                    if (angular.isDefined(data.access_token)) {
                        token = data.access_token;
                        SessionService.setUserAuthenticated(false);
                        Auth = Array();
                        $scope.isAuth = false;
                        $rootScope.isAuth = false;
                        $.removeCookie('auth');
                        $.removeCookie('token');
                        $.removeCookie('refresh_token');
                        $.removeCookie('enabled_plugins');
                        $.removeCookie('isUser');
                        flashMessage = $filter("translate")("Logout successful.");
                        flash.set(flashMessage, 'success', false);
                        $scope.$emit('updateParent', {
                            isAuth: false,
                            auth: ""
                        });
                        var redirectto = $location.absUrl().split('/#!/');
                        redirectto = redirectto[0] + '/';
                        window.location.href = redirectto;
                        location.reload(true);
                    }
                });
            }
        });
    }]);
}(angular.module("ace.users")));
