/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {

}(angular.module('ace.userprofile', [
    'ngResource'
])));

(function(module) {

    module.controller('UserController', ['UserDetail', '$rootScope', 'UserLearning', 'UserTeaching', '$scope', '$location', '$state', 'TokenService', '$filter', 'TokenServiceData', function(UserDetail, $rootScope, UserLearning, UserTeaching, $scope, $location, $state, TokenService, $filter, TokenServiceData) {
        var model = this;
        model.loading = true;
        model.user = [];
        model.teachingCourses = [];
        params = {};

        var promise = TokenService.promise;
        var promiseSettings = TokenService.promiseSettings;
        promiseSettings.then(function(data) {
            if (angular.isDefined(data['ace.courseWishlist'])) {
                $scope.loadCourseWishlist = data['ace.courseWishlist'];
            }
        });

        userID = $state.params.id ? parseInt($state.params.id) : '';
        $scope.auth_user_id = $rootScope.auth ? parseInt($rootScope.auth.id) : '';
        $scope.user_id = userID;
        $scope.currentUrl = $location.absUrl();
        $rootScope.activeMenu = 'settings';
        getUserParams = {
            id: userID,
            field: 'id,biography,displayname,Headline,image_hash,is_teacher,course_user_count,course_favourites_count,designation,twitter_profile_link,google_plus_profile_link,facebook_profile_link,youtube_profile_link,website,linkedin_profile_link'
        };
        params.id = userID;
        params.page = $scope.currentPage;
        params.limit = 12;
        params.field = "course_image_hash,is_from_mooc_affiliate,course_title,course_slug,course_id,course_image,teacher_user_id,teacher_name,average_rating,price,course_price";
        if (angular.isDefined($state.params.id) && $state.params.id !== '') {
            UserDetail.get(getUserParams).$promise.then(function(response) {
                model.user = response.data[0];
                if (model.user) {
                    $rootScope.pageTitle = model.user.displayname + " | " + $rootScope.settings['site.name'];
                } else {
                    $rootScope.pageTitle = model.user.displayname + " | " + $filter("translate")("User");
                }
                model.loading = false;
            }, function(error) {
                if (error.status === 404) {
                    $scope.$emit('updateParent', {
                        isOn404: true,
                        errorNo: error.status
                    });
                }
            });
        } else {
            $scope.$emit('updateParent', {
                isOn404: true,
                errorNo: 404
            });
        }

        function getLearningCourses() {
            UserLearning.get(params).$promise.then(function(response) {
                model.learningCourses = response;
                $scope._metadata = response._metadata;
            });
        }
        var teachParams = {};
        teachParams.id = userID;
        teachParams.limit = 12;
        teachParams.field = 'id,title,slug,price,image_hash';

        function getTeachingCourses() {
            teachParams.page = $scope.currentTeachPage;
            UserTeaching.get(teachParams).$promise.then(function(response) {
                model.teachingCourses = response.data;
                model.teachingCourses._metadata = response._metadata;
            });
        }
        $scope.index = function() {
            $scope.currentPage = ($scope.currentPage !== undefined) ? parseInt($scope.currentPage) : 1;
            if (angular.isDefined($state.params.id) && $state.params.id !== '') {
                getLearningCourses();
            }
        };
        $scope.teachIndex = function() {
            $scope.currentPage = ($scope.currentPage !== undefined) ? parseInt($scope.currentPage) : 1;
            if (angular.isDefined($state.params.id) && $state.params.id !== '') {
                getTeachingCourses();
            }
        };
        $scope.index();
        $scope.teachIndex();
        $scope.paginate = function(pageno) {
            $scope.currentPage = parseInt($scope.currentPage);
            $scope.index();
        };
        $scope.paginateTeaching = function(pageno) {
            $scope.currentTeachPage = parseInt($scope.currentTeachPage);
            $scope.teachIndex();
        };
    }]);
}(angular.module("ace.userprofile")));

(function(module) {
    module.factory('UserDetail', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/users/:id.json', {
            id: '@id'
        }, {
            'update': {
                method: 'PUT'
            },
            'getUser': {
                method: 'GET'
            }
        });
    }]);
    module.factory('UserTeaching', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
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
    module.factory('UserLearning', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/users/:id/course_users.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);
})(angular.module('ace.userprofile'));
