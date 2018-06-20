/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {

}(angular.module('ace.ratingAndReview', [
    'ui.router',
    'ngResource',
])));

(function(module) {
    module.directive('courseFeedback', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'AE',
            templateUrl: "src/app/plugins/RatingAndReview/courseFeedback.tpl.html",
            link: linker,
            controller: 'courseFeedbackController as model',
            bindToController: true,
            scope: {
                courseId: '@courseId',
            }
        };
    });
    module.controller('courseFeedbackController', ['CourseFeedback', '$scope', '$rootScope', '$state', function(CourseFeedback, $scope, $rootScope, $state) {

        var model = this;
        model.courseFeedback = [];
        $scope.feedbackLimit = 12;

        function getCoursesFeedback() {
            params = {};
            params.page = $scope.currentPage;
            params.limit = $scope.feedbackLimit;
            CourseFeedback.get({
                    id: model.courseId,
                    filter: params,
                    field: 'user_id,image_hash,displayname,rating,created,feedback',
                }).$promise
                .then(function(response) {
                    if (response.data.length > 0) {
                        model.courseFeedback = response.data;
                        model.courseFeedback.course_user_feedback_count = response._metadata.total_records;
                        $scope._metadata = response._metadata;
                    }
                });
        }
        $scope.index = function() {
            $scope.currentPage = ($scope.currentPage !== undefined) ? parseInt($scope.currentPage) : 1;
            getCoursesFeedback();
        };
        $scope.index();
        $scope.paginate = function(pageno) {
            $scope.currentPage = parseInt($scope.currentPage);
            $scope.index();
        };
    }]);

})(angular.module('ace.ratingAndReview'));

(function(module) {
    module.factory('CourseUsersFeedback', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/course_users/:id/course_user_feedbacks.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);
    module.factory('CourseFeedback', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/courses/:id/course_user_feedbacks.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);
    module.factory('CourseRating', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/course_user_feedbacks.json'
        );
    }]);
    module.factory('CourseRatingAction', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/course_user_feedbacks/:id.json', {
                id: '@id'
            }, {
                'updaterating': {
                    method: 'PUT'
                }
            }
        );
    }]);
    module.factory('CourseRatingDelete', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/course_user_feedbacks/:id.json', {
                id: '@id'
            }, {
                'deletecourserating': {
                    method: 'Delete'
                }
            }
        );
    }]);
})(angular.module("ace.ratingAndReview"));

(function(module) {
    module.directive('ratingButton', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'AE',
            templateUrl: "src/app/plugins/RatingAndReview/ratingButton.tpl.html",
            link: linker,
            controller: 'ratingButtonController as model',
            bindToController: true,
            scope: {
                courseId: '@courseId',
                courseuserid: '@courseuserid',
                userId: '@userId',
                btnstyle: '@btnstyle',
                btntext: '@btntext',
                averageRating: '@averageRating'
            }
        };
    });
    module.controller('ratingButtonController', ['$scope', '$modal', '$rootScope', function($scope, $modal, $rootScope) {
        var model = this;
        $scope.rating_id = model.courseuserid;
        $scope.course_id = model.courseId;
        $scope.user_id = model.userId;
        $scope.rateCourseClick = function(e) {
            e.preventDefault();
            if (angular.isUndefined($rootScope.modal) || !$rootScope.modal) {
                $modal.open({
                    scope: $scope,
                    templateUrl: 'src/app/plugins/RatingAndReview/ratingAndReviewForm.tpl.html',
                    controller: 'ratingController as model',
                    size: 'md',
                    resolve: {
                        pageType: function() {
                            return "modal";
                        },
                        rating: function() {
                            return model.courseuserid;
                        },
                        TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                            var promiseSettings = TokenService.promiseSettings;
                            return $q.all({
                                load: promiseSettings.then(function(data) {
                                    if (angular.isDefined(data['ace.ratingAndReview']) && $ocLazyLoad.getModules().indexOf('ace.ratingAndReview') === -1) {
                                        var module = data['ace.ratingAndReview'];
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
                });
                $rootScope.modal = true;
            }
        };
    }]);
    module.controller('ratingController', ['$scope', 'pageType', '$rootScope', '$location', 'CourseUsersFeedback', 'CourseRating', '$state', 'CourseRatingAction', 'CourseUserDetails', 'CourseRatingDelete', 'rating', '$filter', 'TokenServiceData', 'flash', function($scope, pageType, $rootScope, $location, CourseUsersFeedback, CourseRating, $state, CourseRatingAction, CourseUserDetails, CourseRatingDelete, rating, $filter, TokenServiceData, flash) {
        var model = this;
        if (pageType === "page") {
            $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Course Rating");
            courseUserID = $state.params.id;
        } else {
            courseUserID = rating;
        }
        model.postCourseRating = postCourseRating;
        model.deleteCourseRating = deleteCourseRating;
        model.updateCourseRating = updateCourseRating;
        model.ratingFormSubmit = ratingFormSubmit;
        model.courseUserDetails = [];
        $scope.action = 'post';
        $scope.feedbackContent = '';
        $scope.isAuth = $rootScope.isAuth;
        $scope.rate = 0;
        $scope.overStar = 0;
        CourseUserDetails.get({
                id: courseUserID
            }).$promise
            .then(function(response) {
                if (response.data[0]) {
                    model.courseUserDetails = response.data[0];
                    CourseUsersFeedback.get({
                            id: response.data[0].id,
                            field: 'id,review_title,feedback,rating'
                        }).$promise
                        .then(function(response) {
                            if (response.data[0]) {
                                FeedbackID = response.data[0].id;
                                model.rateCourse.review_title = response.data[0].review_title;
                                model.rateCourse.feedback = response.data[0].feedback;
                                $scope.feedbackContent = response.data[0].feedback;
                                if ($scope.feedbackContent !== '' && $scope.feedbackContent !== undefined) {
                                    $scope.action = 'edit';
                                }
                                model.rateCourse.rating = response.data[0].rating;
                            }
                            if (model.rateCourse.rating) {
                                $scope.rate = model.rateCourse.rating;
                                $scope.overStar = model.rateCourse.rating;
                            }
                        });
                }
            });
        if (!$scope.isAuth) {
            $location.path('#!/users/login');
        }
        $scope.currentPageType = pageType;
        $scope.modalCancel = function(e) {
            e.preventDefault();
            $scope.$close();
        };
        model.rateCourse = new CourseRating();
        $scope.max = 5;
        $scope.isReadonly = false;
        $scope.hoveringOver = function(value) {
            $scope.overStar = value;
            $scope.percent = 100 * (value / $scope.max);
        };

        function postCourseRating(rateCourse) {
            //model.rateCourse.is_satisfied = 1;
            $scope.ratingAdd = true;
            model.rateCourse.rating = $scope.overStar;
            model.rateCourse.course_id = parseInt(model.courseUserDetails.course_id);
            model.rateCourse.course_user_id = parseInt(model.courseUserDetails.id);
            model.rateCourse.user_id = parseInt(model.courseUserDetails.user_id);
            model.rateCourse.$save()
                .then(function(data) {
                    $state.reload();
                    if (angular.isDefined(data.id !== '' && data.id !== "null")) {
                        succsMsg = $filter("translate")("Review added successfully.");
                        flash.set(succsMsg, 'success', false);
                    }
                })
                .catch(function(error) {

                })
                .finally();
        }

        function updateCourseRating(rateCourse) {
            // model.rateCourse.is_satisfied = 1;
            $scope.ratingUpdate = true;
            model.rateCourse.id = FeedbackID;
            model.rateCourse.rating = $scope.overStar;
            model.rateCourse.course_id = parseInt(model.courseUserDetails.course_id);
            model.rateCourse.course_user_id = parseInt(model.courseUserDetails.id);
            model.rateCourse.user_id = parseInt(model.courseUserDetails.user_id);
            CourseRatingAction.updaterating(model.rateCourse, function(response) {
                $state.reload();
                if (response.error.code === 0) {
                    succsMsg = $filter("translate")("Review updated successfully.");
                    flash.set(succsMsg, 'success', false);
                }
            });
        }

        function deleteCourseRating(e) {
            e.preventDefault();
            $scope.ratingupDelete = true;
            CourseRatingDelete.deletecourserating({
                id: FeedbackID
            }, function(response) {
                $state.reload();
                if (response.error.code === 0) {
                    succsMsg = $filter("translate")("Review deleted successfully.");
                    flash.set(succsMsg, 'success', false);
                }
            });
        }
        //conditional form submit function
        function ratingFormSubmit(value, action) {
            if (action === 'post') {
                postCourseRating(value);
            }
            if (action === 'edit') {
                updateCourseRating(value);
            }
        }
    }]);
})(angular.module('ace.ratingAndReview'));

(function(module) {
    module.directive('ratingStars', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'AE',
            templateUrl: "src/app/plugins/RatingAndReview/ratingStars.tpl.html",
            link: linker,
            controller: 'ratingStarsController as model',
            bindToController: true,
            scope: {
                averageRating: '@averageRating',
            }
        };
    });
    module.controller('ratingStarsController', function() {
        var model = this;
    });

})(angular.module('ace.ratingAndReview'));

(function(module) {
    module.directive('studentSatisfaction', function() {
        var linker = function(scope, element, attrs) {};
        return {
            restrict: 'AE',
            templateUrl: 'src/app/plugins/RatingAndReview/studentSatisfactionButton.tpl.html',
            link: linker,
            controller: 'studentSatisfactionButtonController as model',
            bindToController: true,
            scope: {
                courseId: '@courseId'
            }
        };
    });
    module.controller('studentSatisfactionButtonController', ['$scope', function($scope) {
        var model = this;
        $scope.courseID = model.courseId;
    }]);
    module.controller('studentSatisfactionController', ['$state', '$scope', '$rootScope', 'CourseFeedback', '$filter', 'TokenServiceData', function($state, $scope, $rootScope, CourseFeedback, $filter, TokenServiceData) {
        var model = this;
        model.loading = true;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Manage Course Student Satisfaction");
        model.userFeedback = [];
        model.course = [];
        $scope._metadata = [];

        function getCourseFeedbacks() {
            params = {};
            params.page = $scope._metadata.currentPage;
            FeedbackArr = {
                id: $state.params.id,
                filter: params,
                limit: 12,
                field: 'user_id,image_hash,displayname,rating,created,feedback'
            };
            if (angular.isDefined($state.params.id) && $state.params.id !== '') {
                CourseFeedback.get(FeedbackArr).$promise
                    .then(function(response) {
                        if (response.data.length > 0) {
                            model.userFeedback = response.data;
                            $scope._metadata = response._metadata;
                            model.course.course_user_feedback_count = response._metadata.total_records;
                        }
                        model.loading = false;
                    });
            } else {
                $scope.$emit('updateParent', {
                    isOn404: true,
                    errorNo: 404
                });
            }
        }

        $scope.index = function() {
            $scope.currentPage = $state.params.page ? parseInt($state.params.page) : 1;
            getCourseFeedbacks();
        };
        $scope.index();
        $scope.paginate = function(pageno) {
            $scope.currentPage = parseInt($scope._metadata.currentPage);
            $scope.index();
        };
    }]);
})(angular.module('ace.ratingAndReview'));
