(function(module) {
    module.controller('ViewCourseController', ['$state', '$window', 'ViewCourse', 'User', '$rootScope', 'TakeCourse', '$location', 'Slug', '$scope', '$modal', '$anchorScroll', 'flash', '$filter', 'AddFavourite', 'DeleteFavouriteByCourseId', '$sce', function($state, $window, ViewCourse, User, $rootScope, TakeCourse, $location, Slug, $scope, $modal, $anchorScroll, flash, $filter, AddFavourite, DeleteFavouriteByCourseId, $sce) {
        var model = this;
        if (angular.element('#navbar-scrollspy').length) {
            $("body").scrollspy({
                target: "#navbar-scrollspy"
            });
            $('[data-spy="scroll"]').each(function() {
                $(this).scrollspy('refresh');
            });
            $("#navbar-scrollspy").affix({
                offset: {
                    top: $('header').height()
                }
            });
        }
        model.course = {};
        model.loading = true;
        $scope.WhatActionsStudentsHaveToPerformBeforeBegin = [];
        $scope.whoShouldTakeThisCourseAndWhoShouldNot = [];
        $scope.studentsWillBeAbleTo = [];
        $rootScope.activeMenu = 'library';
        userID = $rootScope.auth ? $rootScope.auth.id : '';
        init();
        $scope.currentUrl = $location.absUrl();

        function init() {
            model.course = getCourse();
        }

        function getCourse() {
            model.loading = true;
            if (angular.isDefined($state.params.id) && $state.params.id !== '') {
                ViewCourse.get({
                        id: $state.params.id,
                        field: 'id,title,slug,subtitle,video_url,is_from_mooc_affiliate,image_hash,course_image,is_promo_video_convert_error,is_promo_video_converting_is_processing,description,user_id,mooc_affiliate_course_link,instructional_level_id,price,category_id,category_name,parent_category_name,parent_category_id,designation,displayname,user_image_hash,course_user_feedback_count,course_user_count,active_online_course_lesson_count,language_name,average_rating,instructional_level_name,headline,students_will_be_able_to,who_should_take_this_course_and_who_should_not,what_actions_students_have_to_perform_before_begin,is_favourite,promo_video'
                    }).$promise
                    .then(function(response) {
                        model.course = response.data[0];
                        if (angular.isUndefined(response.data[0].id)) {
                            $location.path('/error/404');
                        }
                        if (angular.isDefined(response.data[0].video_url)) {
                            model.course.video_url = response.data[0].video_url;
                        }
                        $rootScope.pageTitle = model.course.title + " | " + $rootScope.settings['site.name'];
                        $scope.studentsWillBeAbleTo = (response.data[0].students_will_be_able_to) ? response.data[0].students_will_be_able_to : '';
                        $scope.whoShouldTakeThisCourseAndWhoShouldNot = (response.data[0].who_should_take_this_course_and_who_should_not) ? response.data[0].who_should_take_this_course_and_who_should_not : '';
                        $scope.WhatActionsStudentsHaveToPerformBeforeBegin = (response.data[0].what_actions_students_have_to_perform_before_begin) ? response.data[0].what_actions_students_have_to_perform_before_begin : '';
                        $scope.disqusConfig = {
                            disqus_shortname: $rootScope.settings['disqus.comments.shortname'],
                            disqus_identifier: model.course.id,
                            disqus_title: model.course.title,
                            disqus_url: $scope.currentUrl
                        };
                        model.loading = false;
                        if (angular.isDefined(model.course.user_id)) {
                            User.getUser({
                                    id: model.course.user_id,
                                    field: 'twitter_profile_link,google_plus_profile_link,facebook_profile_link,youtube_profile_link,website,linkedin_profile_link,biography'
                                }).$promise
                                .then(function(response) {
                                    if (angular.isDefined(response.data[0])) {
                                        model.user_profile = response.data[0];
                                    }
                                });
                        }
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

        $scope.gotoAnchorLink = function(e, id, courseFeedbackCount) {
            e.preventDefault();
            // the anchorscroll will work if the course feedback count is more than zero 
            if (courseFeedbackCount > 0 || angular.isUndefined(courseFeedbackCount)) {
                var old = $location.hash();
                $location.hash(id);
                $anchorScroll();
                $location.hash(old);
            }
        };
    }]);
}(angular.module("ace.courses")));
