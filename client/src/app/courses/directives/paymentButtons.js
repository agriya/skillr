(function(module) {
    module.directive('paymentButtons', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'E',
            templateUrl: 'courses/directives/paymentButtons.tpl.html',
            link: linker,
            controller: 'paymentButtons as model',
            bindToController: true,
            scope: {
                coursePrice: '@coursePrice',
                courseId: '@courseId',
                instructionLevel: '@instructionLevel',
                style: '@style',
                title: '@title',
                btnLink: '@btnLink',
                userId: '@userId',
				slug: '@slug'
            }
        };
    });

    module.controller('paymentButtons', ['$state', '$rootScope', 'TakeCourse', '$location', '$modal', 'GetCourseUserEntry', '$scope', 'UserSubscription', 'InstructionLevelSubscription', 'flash', '$filter', function($state, $rootScope, TakeCourse, $location, $modal, GetCourseUserEntry, $scope, UserSubscription, InstructionLevelSubscription, flash, $filter) {
        var model = this;
        model.takeCourse = new TakeCourse();
        model.instructionLevel = parseInt(model.instructionLevel);
        model.coursePrice = parseInt(model.coursePrice);
        model.startLearnCourse = startLearnCourse;
        userID = $rootScope.auth ? $rootScope.auth.id : '';
        $scope.subscribedInstructionLevels = [];
        var courseID = ($state.params.id) ? $state.params.id : model.courseId;
        var init = function() {
            course_user();
            user_subscription();
        };
        init();

        function user_subscription() {
            if ($rootScope.isAuth) {
                UserSubscription.get().$promise
                    .then(function(response) {
                        if (response.data.length > 0) {
                            $scope.subscriptionStatus = true;
                            InstructionLevelSubscription.get({
                                    subscription_id: response.data[0].subscription_id
                                }).$promise
                                .then(function(response) {
                                    for (i = 0; i < response.data.length; i++) {
                                        $scope.subscribedInstructionLevels.push(parseInt(response.data[i].instructional_level_id));
                                    }
                                    if ($.inArray(parseInt(model.instructionLevel), $scope.subscribedInstructionLevels) > -1) {
                                        $scope.course_level_access = true;
                                    } else {
                                        $scope.course_level_access = false;
                                    }
                                });
                        } else {
                            $scope.subscriptionStatus = false;
                        }
                    });
            }
        }


        function course_user() {
            if ($rootScope.isAuth) {
                GetCourseUserEntry.get({
                        course_id: courseID,
                        user_id: userID
                    }).$promise
                    .then(function(response) {
                        if (response.data.length > 0) {
                            if (parseInt(response.data[0].course_user_status_id) !== 1) {
                                $scope.paidStatus = true;
                            } else {
                                $scope.paidStatus = false;
                            }
                        } else {
                            $scope.paidStatus = false;
                        }
                    });
            }
        }

        function startLearnCourse(e, purchseStatus) {
            e.preventDefault();
            if (!$.cookie('refresh_token')) {
                if (angular.isUndefined($rootScope.modal) || !$rootScope.modal) {
                    $modal.open({
                        scope: $scope,
                        templateUrl: 'users/login.tpl.html',
                        controller: 'userLoginController',
                        size: 'lg',
                        resolve: {
                            pageType: function() {
                                return "modal";
                            },
                            TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                                var promiseSettings = TokenService.promiseSettings;
                                return $q.all({
                                    load: promiseSettings.then(function(data) {
                                        if (angular.isDefined(data['ace.socialLogin'])) {
                                            var module = data['ace.socialLogin'];
                                            return $ocLazyLoad.load(module, {
                                                cache: true
                                            });
                                        } else {
                                            return '';
                                        }
                                    })
                                });
                            }]
                        }
                    }).result.then(function(result) {
                        $rootScope.modal = false;
                    }, function(result) {
                        $rootScope.modal = false;
                    }).finally(function() {
                        $rootScope.modal = false;
                        // handle finally
                    });
                    $rootScope.modal = true;
                }
            } else {
                model.takeCourse.course_id = courseID;
                model.takeCourse.user_id = $rootScope.auth ? $rootScope.auth.id : '';
                if (purchseStatus === false) {
                    model.takeCourse.$save()
                        .then(function(response) {
                            if (response.id && response.id !== null) {
                                courseTitle = model.slug;
                                $location.path("/" + courseTitle + "/learn/" + courseID);
                            } else {
                                flashMessage = $filter("translate")("You can\'t read this course.");
                                flash.set(flashMessage, 'error', false);
                            }
                        })
                        .catch(function(error) {

                        })
                        .finally();
                } else {
                    courseTitle = model.slug;
                    $location.path("/" + courseTitle + "/learn/" + courseID);
                }
            }
        }
    }]);
})(angular.module('ace.courses'));
