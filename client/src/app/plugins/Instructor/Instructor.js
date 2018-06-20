/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {
    module.config(['$stateProvider', function($stateProvider) {

    }]);
}(angular.module('ace.instructor', [
    'ui.router',
    'ngResource'

])));

(function(module) {
    module.directive('instructorCourses', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'E',
            templateUrl: 'src/app/plugins/Instructor/InstructorCourses.tpl.html',
            link: linker,
            controller: 'instructorCoursesController as model',
            bindToController: true,
            scope: {
                themeName: '@themeName'
            }
        };
    });

    module.controller('instructorCoursesController', ['$state', 'Course', '$scope', 'Teaching', '$rootScope', 'UserStats', function($state, Course, $scope, Teaching, $rootScope, UserStats) {
        var model = this;
        model.loading = false;
        model.teachingCourses = [];
        model._metadata = [];
        model.stats = [];
        UserStats.get({}).$promise.then(function(response) {
            model.stats = response.data;
        });

        model._metadata = [];

        function getTeachingCourses(element) {
            model.loading = true;
            userID = $rootScope.auth.id;
            params = {};
            $scope.ordering = '';
            orderingval = $state.params.ordering;
            $scope.ordering = $state.params.ordering;

            if (orderingval === 'created') {
                params.sort = 'id';
                params.sort_by = 'DESC';
            }
            if (orderingval === '-created') {
                params.sort = 'id';
                params.sort_by = 'ASC';
            }
            if (orderingval === 'title') {
                params.sort = 'title';
                params.sort_by = 'ASC';
            }
            if (orderingval === '-title') {
                params.sort = 'title';
                params.sort_by = 'DESC';
            }
            if (orderingval === '-title') {
                params.sort = 'title';
                params.sort_by = 'DESC';
            }
            if (orderingval === 'is_published') {
                params.sort = 'course_status_name';
                params.sort_by = 'DESC';
            }
            if (orderingval === '-is_published') {
                params.sort = 'course_status_name';
                params.sort_by = 'ASC';
            }
            params.filter = 'all';
            params.page = model._metadata.currentPage;
            getUserParams = {
                id: userID,
                filter: params,
                limit: 12,
                field: 'id,user_id,title,slug,price,subtitle,image_hash,is_from_mooc_affiliate,course_image,displayname,course_status_name,active_online_course_lesson_count,parent_category_name,parent_category_id,category_name,category_id,instructional_level_name,instructional_level_id'
            };
            Teaching.get(getUserParams).$promise.then(function(response) {
                model.teachingCourses = response;
                model._metadata = response._metadata;
                model.loading = false;
                if (element !== null && angular.isDefined(element)) {
                    $('html, body').animate({
                        scrollTop: $(element).offset().top
                    }, 2000, 'swing', false);
                }
            });
        }
        $scope.index = function(element) {
            model._metadata.currentPage = $state.params.page ? parseInt($state.params.page) : 1;
            getTeachingCourses(element);
        };
        $scope.index(null);
        $scope.paginate = function(element) {
            model._metadata.currentPage = parseInt(model._metadata.currentPage);
            $scope.index(element);
        };
        $scope.goToState = function(state, params) {
            $state.go(state, params);
        };
    }]);
})(angular.module('ace.instructor'));

(function(module) {
    module.factory('Teaching', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/users/:id/courses.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);

    module.factory('UserStats', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/me/stats.json'
        );
    }]);

})(angular.module("ace.instructor"));
