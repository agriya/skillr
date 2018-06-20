/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {


}(angular.module('ace.downloadblefilelesson', [
    'ui.router',
    'ngResource'
])));

(function(module) {
    module.directive('downloadableFileLessonsForm', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here

        };
        return {
            restrict: 'E',
            templateUrl: 'src/app/plugins/DownloadableFileLessons/downloadableFileLessonsForm.tpl.html',
            link: linker,
            controller: 'downloadableFileLessonsFormController as model',
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

    module.controller('downloadableFileLessonsFormController', function(Course, $scope, addOnlineCourseLessons, $http, OnlineCourseLessonsUpdate, flash, GENERAL_CONFIG, $filter, $rootScope) {
        var model = this;
        $scope.label = $filter("translate")("Add Downloadable File");
        $scope.action = model.action;
        $scope.lessonID = model.lessonId;
        $scope.showForm = false;
        $scope.editForm = false;
        $scope.uploadConfigure = function() {
            //to close all forms and show current form
            $scope.$emit('closeLessons', {});
            $scope.showForm = true;
            model.editDownloadableLesson = {};
            model.onlineDownloadableLesson = {};
            model.onlineDownloadableLesson = new addOnlineCourseLessons();
            model.onlineDownloadableLesson.is_active = 0;
            model.onlineDownloadableLesson.is_preview = 0;
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
        if ($scope.action === 'edit') {
            $scope.editForm = true;
            getLessonUpdate();
        }

        courseID = model.course;
        var uploadUrl = GENERAL_CONFIG.api_url + 'api/v1/image_upload.json';
        $scope.disableSave = false;
        $scope.uploadDocumentFile = function(files) {
            $scope.disableSave = true;
            var fd = new FormData();
            //Take the first selected file
            fd.append("attachment", files[0]);
            fd.append("type", "file");
            $http.post(uploadUrl, fd, {
                withCredentials: true,
                headers: {
                    'Content-Type': undefined
                },
                transformRequest: angular.identity
            }).success(function(response, status, headers, config) {
                if (response.error.code === 0) {
                    if ($scope.action === 'edit') {
                        model.editDownloadableLesson.filename = (response.filename);
                    } else {
                        model.onlineDownloadableLesson.filename = (response.filename);
                    }
                    $scope.disableSave = false;
                } else {
                    var errorMessage;
                    if (response.error.code === 1) {
                        errorMessage = $filter("translate")("File couldn't be uploaded. Allowed extensions: mov, mpeg4, avi, wmv, mpeg, flv, 3gpp, webm, mp4.");
                    } else if (response.error.code === 2) {
                        errorMessage = $filter("translate")("File couldn't be uploaded. Allowed extensions: gif, jpeg, jpg, png.");
                    } else {
                        errorMessage = response.error.message;
                    }
                    flash.set(errorMessage, 'error', false);
                }
            }).error();

        };
        $scope.addDownloadFile = function() {
            $scope.disableButton = true;
            model.onlineDownloadableLesson.online_lesson_type_id = 5;
            model.onlineDownloadableLesson.course_id = parseInt(courseID);
            model.onlineDownloadableLesson.is_chapter = 0;
            model.onlineDownloadableLesson.$save()
                .then(function(response) {
                    if (angular.isDefined(response.id !== '' && response.id !== "null")) {
                        succsMsg = $filter("translate")("Downloadable file added successfully.");
                        flash.set(succsMsg, 'success', false);
                    }
                    $scope.showForm = false;
                    $scope.disableButton = false;
                    model.updateparent();
                    model.onlineDownloadableLesson = new addOnlineCourseLessons();
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
                    model.editDownloadableLesson = {};
                    model.editDownloadableLesson.lesson_name = response.data[0].lesson_name;
                    model.editDownloadableLesson.lesson_description = response.data[0].lesson_description;
                    model.editDownloadableLesson.is_preview = response.data[0].is_preview;
                    model.editDownloadableLesson.is_active = response.data[0].is_active;
                });
        }

        $scope.editDownloadFile = function() {
            model.editDownloadableLesson.id = $scope.lessonID;
            model.editDownloadableLesson.online_lesson_type_id = 5;
            model.editDownloadableLesson.name = model.editDownloadableLesson.lesson_name;
            model.editDownloadableLesson.description = model.editDownloadableLesson.lesson_description;
            if (model.editDownloadableLesson.filename === "") {
                delete model.editDownloadableLesson.filename;
            }
            delete model.editDownloadableLesson.lesson_name;
            delete model.editDownloadableLesson.lesson_description;
            OnlineCourseLessonsUpdate.update(model.editDownloadableLesson, function(response) {
                if (response.error.code === 0) {
                    succsMsg = $filter("translate")("Downloadable file updated successfully.");
                    flash.set(succsMsg, 'success', false);
                    $scope.editForm = false;
                    model.updateparent();
                }
            });

        };

    });
})(angular.module('ace.downloadblefilelesson'));

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

})(angular.module('ace.downloadblefilelesson'));
