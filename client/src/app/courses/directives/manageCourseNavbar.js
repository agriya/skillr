(function(module) {
    module.directive('courseNavbar', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'E',
            templateUrl: 'courses/directives/manageCourseNavbar.tpl.html',
            link: linker,
            controller: 'courseNavbarController as model',
            bindToController: true,
            scope: {}
        };
    });

    module.controller('courseNavbarController', ['Course', '$scope', '$rootScope', 'ViewCourse', '$state', '$modal', '$timeout', 'TokenService', 'CourseUpdate', '$filter', 'flash', function(Course, $scope, $rootScope, ViewCourse, $state, $modal, $timeout, TokenService, CourseUpdate, $filter, flash) {
        var model = this;
        model.loadingNavBar = true;
        model.manageCourseOption = [];
        model.publishCourse = publishCourse;
        model.coursePublish = {};

        function publishCourse(type) {
            model.coursePublish.id = $state.params.id;
            if (type === 'publish') {
                model.coursePublish.course_status_id = 3;
                flashMessage = $filter("translate")("Course published successfully.");
            } else if (type === 'waiting') {
                flashMessage = $filter("translate")("Course submitted to review successfully.");
                model.coursePublish.course_status_id = 2;
            } else if (type === 'draft') {
                flashMessage = $filter("translate")("Course is successfully move to draft status.");
                model.coursePublish.course_status_id = 1;
            }
            CourseUpdate.update(model.coursePublish, function(response) {
                getCourseDetails();
                flash.set(flashMessage, 'success', false);
            });
        }

        var promise = TokenService.promise;
        var promiseSettings = TokenService.promiseSettings;
        promiseSettings.then(function(data) {
            if (angular.isDefined(data['ace.ratingAndReview'])) {
                $scope.loadRatingAndReview = data['ace.ratingAndReview'];
            }
            if (angular.isDefined(data['ace.payout'])) {
                $scope.loadPayout = data['ace.payout'];
            }
            if (angular.isDefined(data['ace.seo'])) {
                $scope.loadSeo = data['ace.seo'];
            }
            if (angular.isDefined(data['ace.coupons'])) {
                $scope.loadCoupons = data['ace.coupons'];
            }
        });

        $scope.activetab = $rootScope.activetab;
        if (angular.isDefined($state.params.id) && $state.params.id !== '') {
            getCourseDetails();
        }

        function getCourseDetails() {
            if (angular.isDefined($state.params.id) && $state.params.id !== '') {
                ViewCourse.get({
                        id: $state.params.id,
                        manage: 'ownCourse',
                        field: 'id,title,slug,displayname,user_id,image_hash,is_from_mooc_affiliate,course_image,active_online_course_lesson_count,online_course_lesson_count,course_status_id'
                    }).$promise
                    .then(function(response) {
                        model.manageCourseOption = response.data[0];
                        model.loadingNavBar = false;
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
        }
    }]);
})(angular.module('ace.courses'));
