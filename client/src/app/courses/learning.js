(function(module) {

    module.controller('learningController', ['$state', 'Course', '$scope', 'Learning', '$rootScope', 'AddFavourite', 'Archive', 'flash', '$filter', 'TokenServiceData', function($state, Course, $scope, Learning, $rootScope, AddFavourite, Archive, flash, $filter, TokenServiceData) {
        var model = this;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("My Learning Courses");
        model.learningCourses = [];
        model.addToFavourite = addToFavourite;
        model.addToArchive = addToArchive;
        model.archive = new Archive();
        $scope.userID = $rootScope.auth ? $rootScope.auth.id : '';
        $rootScope.activeMenu = 'dashboard';

        function getLearningCourses(element) {
            userID = $rootScope.auth.id;
            params = {};
            $scope.ordering = '';
            orderingval = $state.params.ordering;
            $scope.ordering = $state.params.ordering;
            if (orderingval === 'favourites') {
                params.filter = 'favourites';
            } else if (orderingval === 'in_progress') {
                params.filter = 'in_progress';
            } else if (orderingval === 'not_started') {
                params.filter = 'not_started';
            } else if (orderingval === 'completed') {
                params.filter = 'completed';
            } else if (orderingval === 'archived') {
                params.filter = 'archived';
            } else if (orderingval === null || orderingval === undefined) {
                params.filter = 'active';
            }
            params.page = $scope.currentPage;
            params.id = userID;
            params.limit = 12;
            params.field = "id,subtitle,course_id,course_title,course_slug,course_image_hash,is_from_mooc_affiliate,course_user_status,teacher_user_id,teacher_name,rating,course_image,completed_lesson_count,active_online_course_lesson_count,parent_category_name,parent_category_id,category_name,instructional_level_name,instructional_level_id,category_id";
            Learning.get(params).$promise.then(function(response) {
                model.learningCourses = response;
                $scope._metadata = response._metadata;
                model.loading = false;
                if (element !== null && angular.isDefined(element)) {
                    $('html, body').animate({
                        scrollTop: $(element).offset().top
                    }, 2000, 'swing', false);
                }
            });
        }

        function addToFavourite(courseID, e) {
            e.preventDefault();
            courseArr = {
                course_id: courseID
            };
        }
        $scope.index = function(element) {
            $scope.currentPage = ($scope.currentPage !== undefined) ? parseInt($scope.currentPage) : 1;
            getLearningCourses(element);
        };
        $scope.index(null);
        $scope.paginate = function(element) {
            $scope.currentPage = parseInt($scope.currentPage);
            $scope.index(element);
        };

        function addToArchive(courseUserID, e, ordering) {
            e.preventDefault();
            model.archive.id = courseUserID;
            model.archive.$save()
                .then(function(response) {
                    if (response.error.code === 0) {
                        if (ordering !== '') {
                            var delElement = angular.element(document.querySelector('#learning_elements_' + courseUserID));
                            delElement.remove();
                        }
                        // to hide pagination when course length is 0
                        learning_course = angular.element(document.getElementsByClassName('course-listing'));
                        learning_course_length = learning_course.children().length;
                        if (angular.isDefined(learning_course_length) && learning_course_length <= 0) {
                            angular.element(document.getElementsByClassName('paging')).addClass("ng-hide");
                        }
                        flashMessage = $filter("translate")("Archived Successfully");
                        flash.set(flashMessage, 'success', false);
                    }
                })
                .catch(function(error) {

                })
                .finally();
        }
        $scope.goToState = function(state, params) {
            $state.go(state, params);
        };
    }]);
}(angular.module("ace.courses")));
