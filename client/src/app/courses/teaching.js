(function(module) {
    module.controller('teachingController', ['$state', '$rootScope', '$scope', '$filter', 'TokenServiceData', function($state, $rootScope, $scope, $filter, TokenServiceData) {
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("My Courses");
        $rootScope.activeMenu = 'dashboard';

    }]);
}(angular.module("ace.courses")));
