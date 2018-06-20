(function(module) {
    module.directive('onlineLessons', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'E',
            templateUrl: 'courses/directives/onlineLessons.tpl.html',
            link: linker,
            controller: 'onlineLessonsController as model',
            bindToController: true,
            scope: {
                course: '=homeCourse',
                lookups: '=courseLookups',
                filter: '@filter',
                limit: '@limit'
            }
        };
    });

    module.controller('onlineLessonsController', ['$state', 'OnlineCourseLessons', '$scope', function($state, OnlineCourseLessons, $scope) {
        var model = this;
        model.OnlineCourse = {};
        var courseArr = {
            id: $state.params.id,
            sort: 'display_order',
            sort_by: 'ASC',
            limit: 'all',
            field: 'id,course_title,course_slug,is_chapter,lesson_name,online_lesson_type_id,lesson_description,is_preview,course_id,lesson_description,is_lesson_ready_to_view,duration'
        };
        OnlineCourseLessons.get(courseArr).$promise
            .then(function(response) {
                model.OnlineCourse = response;
            });
        $scope.showDetail = function(OnlineCourse, e) {
            e.preventDefault();
            if ($scope.active != OnlineCourse.id) {
                $scope.active = OnlineCourse.id;
            } else {
                $scope.active = null;
            }
        };
        $scope.getDuration = function(obj, e) {
            return obj.replace('.', ':');
        };
    }]);
})(angular.module('ace.courses'));
