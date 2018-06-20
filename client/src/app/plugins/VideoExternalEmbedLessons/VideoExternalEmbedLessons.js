/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {


}(angular.module('ace.videoembedorexternallesson', [
    'ui.router',
    'ngResource'
])));

(function(module) {
    module.directive('videoExternalEmbedLessonsForm', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'E',
            templateUrl: 'src/app/plugins/VideoExternalEmbedLessons/videoExternalEmbedLessonsForm.tpl.html',
            link: linker,
            controller: 'videoExternalEmbedLessonsFormController as model',
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

    module.controller('videoExternalEmbedLessonsFormController', function(Course, $scope, addOnlineCourseLessons, OnlineCourseLessonsUpdate, $filter, flash, $rootScope) {
        var model = this;
        $scope.label = $filter("translate")("Add Video Embed");
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
            model.editOnlineVideoEmbedLesson = {};
            model.onlineVideoEmbedLesson = {};
            model.onlineVideoEmbedLesson = new addOnlineCourseLessons();
            model.onlineVideoEmbedLesson.is_active = 0;
            model.onlineVideoEmbedLesson.is_preview = 0;
        };
        $scope.hideForm = function(e) {
            e.preventDefault();
            $scope.showForm = false;
            $scope.editForm = false;
        };
        //to close all forms and show current form
        $rootScope.$on('closeLessons', function(event, args) {
            $scope.showForm = false;
        });
        courseID = model.course;
        $scope.addExternalOrEmbed = function() {
            $scope.disableButton = true;
            model.onlineVideoEmbedLesson.online_lesson_type_id = 4;
            model.onlineVideoEmbedLesson.course_id = parseInt(courseID);
            model.onlineVideoEmbedLesson.is_chapter = 0;
            model.onlineVideoEmbedLesson.$save()
                .then(function(response) {
                    if (angular.isDefined(response.id)) {
                        succsMsg = $filter("translate")("Embed video added successfully.");
                        flash.set(succsMsg, 'success', false);
                        $scope.showForm = false;
                        model.updateparent();
                    } else {
                        if (response.error.code === 2) {
                            err_message = $filter("translate")("Site couldn\'t process your video URL. Please enter valid URL or some other URL.");
                            flash.set(err_message, 'error', false);
                        }
                    }
                    model.onlineVideoEmbedLesson = new addOnlineCourseLessons();
                    $scope.disableButton = false;
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
                    model.editOnlineVideoEmbedLesson = {};
                    model.editOnlineVideoEmbedLesson.lesson_name = response.data[0].lesson_name;
                    model.editOnlineVideoEmbedLesson.lesson_description = response.data[0].lesson_description;
                    model.editOnlineVideoEmbedLesson.is_preview = response.data[0].is_preview;
                    model.editOnlineVideoEmbedLesson.is_active = response.data[0].is_active;
                });
        }

        $scope.editExternalOrEmbed = function() {
            $scope.disableButton = true;
            model.editOnlineVideoEmbedLesson.online_lesson_type_id = 4;
            model.editOnlineVideoEmbedLesson.id = $scope.lessonID;
            model.editOnlineVideoEmbedLesson.name = model.editOnlineVideoEmbedLesson.lesson_name;
            model.editOnlineVideoEmbedLesson.description = model.editOnlineVideoEmbedLesson.lesson_description;
            if (model.editOnlineVideoEmbedLesson.embed_code === "") {
                delete model.editOnlineVideoEmbedLesson.embed_code;
            }
            delete model.editOnlineVideoEmbedLesson.lesson_name;
            delete model.editOnlineVideoEmbedLesson.lesson_description;
            OnlineCourseLessonsUpdate.update(model.editOnlineVideoEmbedLesson, function(response) {
                if (response.error.code === 0) {
                    succsMsg = $filter("translate")("Embed video updated successfully.");
                    flash.set(succsMsg, 'success', false);
                    $scope.editForm = false;
                    model.updateparent();
                }
                if (response.error.code === 2) {
                    err_message = $filter("translate")("Site couldn\'t process your video URL. Please enter valid URL or some other URL.");
                    flash.set(err_message, 'error', false);
                }
                $scope.disableButton = false;
            });
        };
    });
})(angular.module('ace.videoembedorexternallesson'));

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

}(angular.module('ace.videoembedorexternallesson')));
