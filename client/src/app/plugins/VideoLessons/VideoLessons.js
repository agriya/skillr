/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {


}(angular.module('ace.videolesson', [
    'ui.router',
    'ngResource'
])));

(function(module) {
    module.directive('videoLessonsForm', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here

        };
        return {
            restrict: 'E',
            templateUrl: 'src/app/plugins/VideoLessons/videoLessonsForm.tpl.html',
            link: linker,
            controller: 'videoLessonsFormController as model',
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

    module.controller('videoLessonsFormController', ['Course', '$scope', 'addOnlineCourseLessons', '$http', 'OnlineCourseLessons', 'OnlineCourseLessonsUpdate', 'flash', '$filter', 'GENERAL_CONFIG', '$rootScope', function(Course, $scope, addOnlineCourseLessons, $http, OnlineCourseLessons, OnlineCourseLessonsUpdate, flash, $filter, GENERAL_CONFIG, $rootScope) {
        var model = this;
        $scope.action = model.action;
        $scope.lessonID = model.lessonId;
        $scope.showForm = false;
        $scope.editForm = false;
        if ($scope.action === 'edit') {
            $scope.editForm = true;
            getLessonUpdate();
        }
        $scope.label = $filter("translate")("Add Video");

        $scope.uploadConfigure = function() {
            //to close all forms and show current form
            $scope.$emit('closeLessons', {});
            $scope.showForm = true;
            model.editOnlineVideoLesson = {};
            model.onlineVideoLesson = {};
            model.onlineVideoLesson = new addOnlineCourseLessons();
            model.onlineVideoLesson.is_active = 0;
            model.onlineVideoLesson.is_preview = 0;
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
        var uploadUrl = GENERAL_CONFIG.api_url + 'api/v1/image_upload.json';
        $scope.disableSave = false;

        courseID = model.course;
        $scope.uploadVideo = function(files) {
            $scope.disableSave = true;
            var fd = new FormData();
            //Take the first selected file
            fd.append("attachment", files[0]);
            fd.append("type", "video");
            $http.post(uploadUrl, fd, {
                withCredentials: true,
                headers: {
                    'Content-Type': undefined
                },
                transformRequest: angular.identity
            }).success(function(response, status, headers, config) {
                if (response.error.code === 0) {
                    if ($scope.action === 'edit') {
                        model.editOnlineVideoLesson.filename = (response.filename);
                    } else {
                        model.onlineVideoLesson.filename = (response.filename);
                    }
                } else {
                    if ($scope.action === 'edit') {
                        delete(model.editOnlineVideoLesson.filename);
                    } else {
                        delete(model.onlineVideoLesson.filename);
                    }
                    $("#inputTaskAttachments").val("");
                    if (response.error.code === 1) {
                        errorMessage = $filter("translate")("File couldn't be uploaded. Allowed extensions: mov, mpeg4, avi, wmv, mpeg, flv, 3gpp, webm, mp4.");
                    } else if (response.error.code === 2) {
                        errorMessage = $filter("translate")("File couldn't be uploaded. Allowed extensions: gif, jpeg, jpg, png.");
                    } else if (response.error.code === 3) {
                        errorMessage = $filter("translate")("The uploaded file size exceeds the allowed size.");
                    } else {
                        errorMessage = response.error.message;
                    }
                    flash.set(errorMessage, 'error', false);
                }
                $scope.disableSave = false;
            }).error();
        };

        $scope.addVideoDetails = function(e) {
            $scope.disableButton = true;
            model.onlineVideoLesson.online_lesson_type_id = 3;
            model.onlineVideoLesson.course_id = parseInt(courseID);
            model.onlineVideoLesson.is_chapter = 0;
            model.onlineVideoLesson.$save()
                .then(function(response) {
                    if (response.id) {
                        $scope.showForm = false;
                        if (angular.isDefined(response.id !== '' && response.id !== "null")) {
                            succsMsg = $filter("translate")("Video added successfully.");
                            flash.set(succsMsg, 'success', false);
                        }
                        model.updateparent();

                    }
                    $scope.disableButton = false;
                    model.onlineVideoLesson = new addOnlineCourseLessons();
                })
                .catch(function(error) {

                })
                .finally(function() {

                });
        };

        function getLessonUpdate() {
            OnlineCourseLessonsUpdate.get({
                    id: $scope.lessonID
                }).$promise
                .then(function(response) {
                    model.editOnlineVideoLesson = {};
                    model.editOnlineVideoLesson.lesson_name = response.data[0].lesson_name;
                    model.editOnlineVideoLesson.lesson_description = response.data[0].lesson_description;
                    model.editOnlineVideoLesson.is_preview = response.data[0].is_preview;
                    model.editOnlineVideoLesson.is_active = response.data[0].is_active;
                });
        }

        $scope.editVideodetails = function(e) {
            model.editOnlineVideoLesson.online_lesson_type_id = 3;
            model.editOnlineVideoLesson.id = $scope.lessonID;
            model.editOnlineVideoLesson.name = model.editOnlineVideoLesson.lesson_name;
            model.editOnlineVideoLesson.description = model.editOnlineVideoLesson.lesson_description;
            if (model.editOnlineVideoLesson.filename === "") {
                delete model.editOnlineVideoLesson.filename;
            }
            delete model.editOnlineVideoLesson.lesson_name;
            delete model.editOnlineVideoLesson.lesson_description;
            OnlineCourseLessonsUpdate.update(model.editOnlineVideoLesson, function(response) {
                if (response.error.code === 0) {
                    succsMsg = $filter("translate")("Video updated successfully.");
                    flash.set(succsMsg, 'success', false);
                    $scope.editForm = false;
                    model.updateparent();
                }
            });
        };
    }]);
})(angular.module('ace.videolesson'));

(function(module) {
    module.factory('OnlineCourseLessons', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/courses/:id/online_course_lessons.json', {
                id: '@id'
            }
        );
    }]);

    module.factory('OnlineCourseLessonsUpdate', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/online_course_lessons/:id.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);

    module.factory('addOnlineCourseLessons', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/online_course_lessons.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);

})(angular.module("ace.videolesson"));
