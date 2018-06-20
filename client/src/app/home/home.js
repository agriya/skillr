(function(module) {
    module.controller('HomeController', ['$scope', '$state', '$rootScope', 'FreeTrailFormData', '$location', 'TokenServiceData', '$filter', function($scope, $state, $rootScope, FreeTrailFormData, $location, TokenServiceData, $filter) {
        var model = this;
        model.freetrail = [];
        model.claimFreeTrail = claimFreeTrail;

        function claimFreeTrail(FreeTrailFormValues) {
            FreeTrailFormData.set(FreeTrailFormValues);
            $location.path('/users/signup');
        }

        $scope.goToState = function(state, params) {
            $state.go(state, params);
        };
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Online Courses Anytime, Anywhere");
        $scope.myInterval = 5000;
        $scope.noWrapSlides = false;
        $scope.active = 0;
    }]);
    // The name of the module, followed by its dependencies (at the bottom to facilitate enclosure)
}(angular.module("ace.home")));
