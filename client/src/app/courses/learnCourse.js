(function(module) {
    module.controller('learnCourseController', ['$state', '$scope', 'OnlineCourseLessons', 'TokenService', '$rootScope', 'OnlineCourseLessonsUpdate', '$sce', 'OnlineLessonViewPost', 'OnlineLessonViewComplete', '$modal', 'GetCourseUserEntry', '$filter', 'TokenServiceData', 'OnlineCourseLessonsNeighbour', 'flash', '$anchorScroll', function($state, $scope, OnlineCourseLessons, TokenService, $rootScope, OnlineCourseLessonsUpdate, $sce, OnlineLessonViewPost, OnlineLessonViewComplete, $modal, GetCourseUserEntry, $filter, TokenServiceData, OnlineCourseLessonsNeighbour, flash, $anchorScroll) {
        var model = this;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Lessons");
        model.OnlineCourse = [];
        model.viewLessonDetails = [];
        model.neighbourDetails = [];
        model.neighbourDetails.next_id = null;
        model.neighbourDetails.previous_id = null;
        model.viewLessonDetails.completedId = '';
        model.lessonViewCompleteDetails = {};
        model.viewLesson = viewLesson;
        model.lessonComplete = lessonComplete;
        courseID = $state.params.id ? $state.params.id : '';
        $scope.lessonID = $state.params.lesson ? parseInt($state.params.lesson) : '';
        $scope.shouldChangePlan = false;
        var courseUserID = '';
        var courseArr;
        //change params on location reload false
        $scope.$on('$locationChangeSuccess', function() {
            courseID = $state.params.id ? $state.params.id : '';
            $scope.lessonID = $state.params.lesson ? parseInt($state.params.lesson) : '';
            viewLesson($state.params.lesson);
        });
        //getting online lessons based on this course
        if ($rootScope.isAuth) {
            courseArr = {
                id: courseID,
                sort: 'display_order',
                sort_by: 'ASC',
                view: 'learner_view',
                limit: 'all',
            };
        } else {
            courseArr = {
                id: courseID,
                sort: 'display_order',
                sort_by: 'ASC',
                limit: 'all',
            };
        }
        var init = function() {
            coursePurchasedStatus();
            //getting online course lesssons initially
            getOnlineCourseLessons();
        };
        init();
        // completed status 
        function coursePurchasedStatus() {
            userID = $rootScope.auth ? $rootScope.auth.id : '';
            var params = {};
            params.course_id = courseID;
            params.user_id = userID;
            if (userID) {
                GetCourseUserEntry.get(params).$promise
                    .then(function(response) {
                        if (angular.isDefined(response.data[0])) {
                            courseUserID = response.data[0].id;
                            $scope.coursePurchased = true;
                        } else {
                            $scope.coursePurchased = false;
                        }
                    });
            }

        }

        function getOnlineCourseLessons() {
            OnlineCourseLessons.get(courseArr).$promise
                .then(function(response) {
                    model.OnlineCourse = response.data;
                    model.OnlinelessonLength = parseInt(model.OnlineCourse.length);
                    if (response.data) {
                        if (angular.isUndefined($state.params.lesson) || !$state.params.lesson) {
                            GetFirstLesson = false;
                            angular.forEach(response.data, function(data, i) {
                                if (GetFirstLesson) {
                                    return;
                                }
                                if (data.is_chapter === 0) {
                                    //by default it shows first lesson not a chapter
                                    viewLesson(data.id);
                                    GetFirstLesson = true;
                                }
                            });
                        } else {
                            //if url comes with lesson id it directly opens it
                            viewLesson($state.params.lesson);
                        }
                    }
                });
        }
        //view individual lesson based on id
        function viewLesson(id) {
            $anchorScroll();
            if (angular.isDefined(id) && id !== null) {
                model.viewLessonDetails.id = id;
                params = {};
                params.id = id;
                model.lessonViewPostValues = {};
                OnlineCourseLessonsUpdate.get(params).$promise
                    .then(function(response) {
                        //It return error code 1 -> when preview false 
                        //It returns error code 1 -> when subscription payment pending
                        //It returns error code 1 -> when payment pending
                        //It returns error code 2 -> when subscrition plan is not enough to access course instruction level
                        if (response.error) {
                            $scope.shouldBuyCourse = true;
                            if (response.error.code === 1) {
                                $scope.shouldBuyCourse = true;
                            }
                            if (response.error.code === 2) {
                                $scope.shouldBuyCourse = true;
                                $scope.shouldChangePlan = true;
                            }
                        } else {
                            // Not authenticated
                            if (!$.cookie('refresh_token')) {
                                $scope.shouldBuyCourse = false;
                                model.viewLessonDetails = response.data[0];
                                model.lessonViewPostValues.course_id = response.data[0].course_id;
                                model.lessonViewPostValues.online_course_lesson_id = response.data[0].id;
                                model.viewLessonDetails.embed_code = $sce.trustAsHtml(response.data[0].embed_code);
                                if (angular.isDefined(response.data[0].download_url)) {
                                    model.viewLessonDetails.download_url = response.data[0].download_url;
                                }
                                if (angular.isDefined(response.data[0].video_url)) {
                                    model.viewLessonDetails.video_url = response.data[0].video_url;
                                }
                            } else { // authenticated
                                $scope.shouldBuyCourse = false;
                                model.viewLessonDetails = response.data[0];
                                model.lessonViewPostValues.course_id = response.data[0].course_id;
                                model.lessonViewPostValues.online_course_lesson_id = response.data[0].id;
                                model.lessonViewPostValues.course_user_id = courseUserID;

                                model.viewLessonDetails.embed_code = $sce.trustAsHtml(response.data[0].embed_code);
                                if (angular.isDefined(response.data[0].download_url)) {
                                    model.viewLessonDetails.download_url = response.data[0].download_url;
                                }
                                if (angular.isDefined(response.data[0].video_url)) {
                                    model.viewLessonDetails.video_url = response.data[0].video_url;
                                }
                                if ($rootScope.isAuth && response.data[0].viewed !== '1') {
                                    // add lesson views for first time i.e when viewed not equal to true
                                    OnlineLessonViewPost.lessonViewPost(model.lessonViewPostValues, function(response) {
                                        if (response) {
                                            for (i = 0; i < model.OnlineCourse.length; i++) {
                                                if (model.OnlineCourse[i].id === id) {
                                                    model.OnlineCourse[i].viewcompleted = 1;
                                                }
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    });
                //getting previous and next id of lessons 
                OnlineCourseLessonsNeighbour.get({
                        id: id
                    }).$promise
                    .then(function(response) {
                        if (angular.isDefined(response)) {
                            model.neighbourDetails = response;
                        }
                    });
            }
        }
        // to change lesson completed status
        function lessonComplete(onlinelessonid, completedStatus) {
            if (completedStatus.completed === '1') {
                model.viewLessonDetails.completed = '0';
                model.viewLessonDetails.completedId = '';
                for (i = 0; i < model.OnlineCourse.length; i++) {
                    if (model.OnlineCourse[i].id === onlinelessonid) {
                        model.OnlineCourse[i].completed = '0';
                    }
                }
            } else if (completedStatus.completed === '0') {
                model.viewLessonDetails.completed = '1';
                for (i = 0; i < model.OnlineCourse.length; i++) {

                    if (model.OnlineCourse[i].id === onlinelessonid) {
                        model.OnlineCourse[i].completed = '1';
                    }
                }
                model.viewLessonDetails.completedId = completedStatus.id;
            }
            model.lessonViewCompleteDetails.id = onlinelessonid;
            model.lessonViewCompleteDetails.is_completed = 1;
            OnlineLessonViewComplete.lessonViewComplete(model.lessonViewCompleteDetails, function(response) {
                if (response.error.code === 0) {
                    success_msg = $filter("translate")("Changes Updated Successfully");
                    flash.set(success_msg, "success", false);
                }
            });
        }
        $scope.modalLogin = function(e) {
            e.preventDefault();
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
        };
    }]);
}(angular.module("ace.courses")));
