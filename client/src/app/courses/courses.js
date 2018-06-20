(function(module) {
    module.controller('CoursesController', ['Course', '$state', '$scope', 'TokenServiceData', '$filter', '$rootScope', function(Course, $state, $scope, TokenServiceData, $filter, $rootScope) {
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Courses");
        var model = this;
        model.loading = false;
        model.courses = [];
        $scope.category_id = $state.params.id ? $state.params.id : '';
    }]);
}(angular.module("ace.courses")));
