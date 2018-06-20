/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {


}(angular.module('ace.articlelesson', [
    'ui.router',
    'ngResource'
])));

(function(module) {
    module.directive('articleLessonsForm', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here

        };
        return {
            restrict: 'E',
            templateUrl: 'src/app/plugins/ArticleLessons/articleLessonsForm.tpl.html',
            link: linker,
            controller: 'articleLessonsFormController as model',
            bindToController: true,
            transclude: true,
            scope: {
                course: '@course',
                action: '@action',
                lessonId: '@lessonId',
                updateparent: '&'
            }
        };
    });

    module.controller('articleLessonsFormController', function(Course, $scope, addOnlineCourseLessons, OnlineCourseLessons, OnlineCourseLessonsUpdate, $filter, flash, $rootScope) {
        var model = this;
        $scope.label = $filter("translate")("Add Article");
        $scope.action = model.action;
        $scope.lessonID = model.lessonId;
        $scope.showForm = false;
        $scope.editForm = false;
        if ($scope.action === 'edit') {
            $scope.editForm = true;
            getLessonUpdate();
        }
        $scope.uploadConfigure = function() {
            //to close all forms and show current form
            $scope.$emit('closeLessons', {});
            $scope.showForm = true;
            model.editOnlineLesson = {};
            model.onlineLesson = {};
            model.onlineLesson = new addOnlineCourseLessons();
            model.onlineLesson.is_active = 0;
            model.onlineLesson.is_preview = 0;
        };
        //to close all forms and show current form
        $rootScope.$on('closeLessons', function(event, args) {
            $scope.showForm = false;
            //to clear textangular editor vaildation scope values.
            $scope.info = "";
            $scope.error = false;
        });

        $scope.hideForm = function(e) {
            e.preventDefault();
            $scope.showForm = false;
            $scope.editForm = false;
        };
        //model.editOnlineLesson = [];       
        courseID = model.course;
        $scope.error = false;
        $scope.addArticle = function(e, add_article) {
            $scope.error = false;
            if (add_article.article_content.$invalid) {
                $scope.info = $filter("translate")("Lesson could not be updated. Please enter article content.");
                $scope.error = true;
                return;
            }
            $scope.disableButton = true;
            model.onlineLesson.online_lesson_type_id = 1;
            model.onlineLesson.course_id = parseInt(courseID);
            model.onlineLesson.is_chapter = 0;
            model.onlineLesson.$save()
                .then(function(response) {
                    $scope.showForm = false;
                    model.updateparent();
                    $scope.disableButton = false;
                    if (angular.isDefined(response.id !== '' && response.id !== "null")) {
                        succsMsg = $filter("translate")("Article added successfully.");
                        flash.set(succsMsg, 'success', false);
                    }
                    model.onlineLesson = new addOnlineCourseLessons();
                })
                .catch(function(error) {

                })
                .finally();
        };

        function getLessonUpdate() {
            OnlineCourseLessonsUpdate.get({
                    id: $scope.lessonID
                }).$promise
                .then(function(response) {
                    model.editOnlineLesson = {};
                    model.editOnlineLesson.lesson_name = response.data[0].lesson_name;
                    model.editOnlineLesson.lesson_description = response.data[0].lesson_description;
                    model.editOnlineLesson.filename = response.data[0].filename;
                    model.editOnlineLesson.edit_article_content = response.data[0].article_content;
                    model.editOnlineLesson.is_preview = response.data[0].is_preview;
                    model.editOnlineLesson.is_active = response.data[0].is_active;
                });
        }

        $scope.editArticle = function(e, edit_article) {
            $scope.error = false;
            if (edit_article.edit_article_content.$invalid) {
                $scope.info = $filter("translate")("Lesson could not be updated. Please enter article content.");
                $scope.error = true;
                return;
            }
            $scope.disableButton = true;
            model.editOnlineLesson.id = $scope.lessonID;
            model.editOnlineLesson.online_lesson_type_id = 1;
            model.editOnlineLesson.name = model.editOnlineLesson.lesson_name;
            model.editOnlineLesson.description = model.editOnlineLesson.lesson_description;
            model.editOnlineLesson.article_content = model.editOnlineLesson.edit_article_content;
            delete model.editOnlineLesson.lesson_name;
            delete model.editOnlineLesson.lesson_description;
            delete model.editOnlineLesson.edit_article_content;
            OnlineCourseLessonsUpdate.update(model.editOnlineLesson, function(response) {
                if (response.error.code === 0) {
                    succsMsg = $filter("translate")("Article updated successfully.");
                    flash.set(succsMsg, 'success', false);
                    $scope.editForm = false;
                    model.updateparent();
                }
                $scope.disableButton = false;
            });
        };

    });
})(angular.module('ace.articlelesson'));

(function(module) {
    module.factory('OnlineCourseLessons', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/courses/:id/online_course_lessons.json', {
                id: '@id'
            }
        );
    });
    module.factory('OnlineCourseLessonsUpdate', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/online_course_lessons/:id.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    });

    module.factory('addOnlineCourseLessons', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/online_course_lessons.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    });

})(angular.module('ace.articlelesson'));
