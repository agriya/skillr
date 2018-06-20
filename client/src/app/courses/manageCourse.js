(function(module) {

    module.controller('manageCourseController', ['$state', 'Course', 'Pages', '$filter', 'TokenServiceData', '$rootScope', '$scope', function($state, Course, Pages, $filter, TokenServiceData, $rootScope, $scope) {
        var model = this;
        model.loading = true;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Manage Course");
        model.courseRoadmap = [];
        var slugName = 'course-road-map';
        var params = {};
        params.slug = slugName;
        params.iso2 = $.cookie("currentLocale");
        staticRoadMap();
        $rootScope.$on('changeLanguage', function(event, args) {
            params.iso2 = args.currentLocale;
            staticRoadMap();
        });

        function staticRoadMap() {
            if (angular.isDefined($state.params.id) && $state.params.id !== '') {
                Pages.get(params).$promise
                    .then(function(response) {
                        model.courseRoadmap = response.data[0];
                        model.loading = false;
                    });
            } else {
                $scope.$emit('updateParent', {
                    isOn404: true,
                    errorNo: 404
                });
            }
        }

    }]);
    module.controller('ManageCourseFeedbackController', ['Pages', '$filter', 'TokenServiceData', '$rootScope', '$state', '$scope', function(Pages, $filter, TokenServiceData, $rootScope, $state, $scope) {
        var model = this;
        model.loading = true;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Manage Course Feedback");
        model.courseFeedback = [];
        var slugName = 'manage-course-feedback';
        var params = {};
        params.slug = slugName;
        params.iso2 = $.cookie("currentLocale");
        staticCourseFeedback();
        $rootScope.$on('changeLanguage', function(event, args) {
            params.iso2 = args.currentLocale;
            staticCourseFeedback();
        });

        function staticCourseFeedback() {
            if (angular.isDefined($state.params.id) && $state.params.id !== '') {
                Pages.get(params).$promise
                    .then(function(response) {
                        model.courseFeedback = response.data[0];
                        model.loading = false;
                    });
            } else {
                $scope.$emit('updateParent', {
                    isOn404: true,
                    errorNo: 404
                });
            }
        }
    }]);
    module.controller('ManageCourseGoalsController', ['$state', '$scope', '$rootScope', 'ViewCourse', 'CourseUpdate', 'InstructionLevels', '$location', 'flash', '$filter', 'TokenServiceData', function($state, $scope, $rootScope, ViewCourse, CourseUpdate, InstructionLevels, $location, flash, $filter, TokenServiceData) {
        var model = this;
        model.loading = true;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Manage Course Goals");
        model.courseGoals = {};
        model.courseGoals.what_actions_students_have_to_perform_before_begin = '';
        model.courseGoals.who_should_take_this_course_and_who_should_not = '';
        model.courseGoals.students_will_be_able_to = '';
        model.InstructionLevels = {};
        if (angular.isDefined($state.params.id) && $state.params.id !== '') {
            ViewCourse.get({
                    id: $state.params.id,
                    field: 'id,students_will_be_able_to,who_should_take_this_course_and_who_should_not,what_actions_students_have_to_perform_before_begin,instructional_level_id'
                }).$promise
                .then(function(response) {
                    model.loading = false;
                    model.courseGoals.students_will_be_able_to = (response.data[0].students_will_be_able_to) ? response.data[0].students_will_be_able_to : '';
                    model.courseGoals.who_should_take_this_course_and_who_should_not = (response.data[0].who_should_take_this_course_and_who_should_not) ? response.data[0].who_should_take_this_course_and_who_should_not : '';
                    model.courseGoals.what_actions_students_have_to_perform_before_begin = (response.data[0].what_actions_students_have_to_perform_before_begin) ? response.data[0].what_actions_students_have_to_perform_before_begin : '';
                    model.courseGoals.instructional_level_id = response.data[0].instructional_level_id;
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

        InstructionLevels.get({
                sort_by: 'ASC'
            }).$promise
            .then(function(response) {
                model.InstructionLevels = response.data;
            });

        model.goalsSave = goalsSave;

        function goalsSave() {
            CoursesID = $state.params.id;
            var flashMessage = '';
            model.courseGoals.id = CoursesID;
            CourseUpdate.update(model.courseGoals, function(response) {
                flashMessage = $filter("translate")("Course goals has been updated successfully.");
                flash.set(flashMessage, 'success', false);
            });
        }
    }]);
    module.controller('ManageCourseCurriculumController', ['$state', '$scope', 'OnlineCourseLessons', 'ViewCourse', 'addOnlineCourseLessons', 'UpdateDispalyOrder', 'OnlineCourseLessonsDelete', '$rootScope', 'OnlineCourseLessonsUpdate', 'TokenServiceData', 'flash', '$filter', function($state, $scope, OnlineCourseLessons, ViewCourse, addOnlineCourseLessons, UpdateDispalyOrder, OnlineCourseLessonsDelete, $rootScope, OnlineCourseLessonsUpdate, TokenServiceData, flash, $filter) {
        var model = this;
        model.loading = true;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Manage Course Curriculum");
        model.OnlineCourse = [];
        model.deleteLesson = [];
        model.editOnlineChapter = {};
        model.AddOnlineChapter = new addOnlineCourseLessons();
        getOnlineCourses();
        model.addChapterClick = addChapterClick;
        model.addChapterCancel = addChapterCancel;
        model.editChapterCancel = editChapterCancel;
        model.addChapter = addChapter;
        model.addLesson = addLesson;
        model.updateChapter = updateChapter;
        model.lessonTitleEdit = lessonTitleEdit;
        model.lessonTitleEditClose = lessonTitleEditClose;
        model.deleteLessonFun = deleteLessonFun;
        model.cancelAddLesson = cancelAddLesson;
        model.getOnlineCourses = getOnlineCourses;
        model.displayOrder = {};
        model.addsection = false;
        $scope.openLesson = false;
        $scope.openItem = '';
        $scope.courseID = $state.params.id;
        model.editsection = true;
        $scope.formStatus = 'close';

        $scope.sortableOptions = {
            update: function(e, ui) {
                var logEntry = model.OnlineCourse.data.map(function(i) {
                    return i.id;
                }).join(', ');
                //updateDisplayOrder(logEntry);
            },
            axis: 'y',
            stop: function(e, ui) {
                var logEntry = model.OnlineCourse.data.map(function(i) {
                    return i.id;
                }).join(', ');
                updateDisplayOrder(logEntry);
            }
        };

        function updateDisplayOrder(logEntry) {
            model.displayOrder.online_course_lessons = logEntry;
            model.displayOrder.id = $scope.courseID;
            UpdateDispalyOrder.update(model.displayOrder, function() {

            });
        }

        function updateChapter(lessonID) {
            $scope.disableUpdateButton = true;
            model.editOnlineChapter.id = lessonID;
            model.editOnlineChapter.name = model.editOnlineChapter.lesson_name;
            model.editOnlineChapter.description = model.editOnlineChapter.lesson_description;
            delete model.editOnlineChapter.lesson_name;
            delete model.editOnlineChapter.lesson_description;
            OnlineCourseLessonsUpdate.update(model.editOnlineChapter, function(response) {
                if (response.error.code === 0) {
                    succsMsg = $filter("translate")("Chapter updated successfully.");
                    flash.set(succsMsg, 'success', false);
                    getOnlineCourses();
                }
                $scope.disableUpdateButton = false;
            });
        }

        function addChapterClick(e) {
            e.preventDefault();
            model.addsection = true;
        }

        function addChapterCancel(e) {
            e.preventDefault();
            model.addsection = false;
        }

        function editChapterCancel(e) {
            e.preventDefault();
            model.editsection = false;
        }

        function addChapter(e) {
            e.preventDefault();
            $scope.disableButton = true;
            model.AddOnlineChapter.course_id = parseInt($scope.courseID);
            model.AddOnlineChapter.is_chapter = 1;
            model.AddOnlineChapter.is_preview = 1;
            model.AddOnlineChapter.online_lesson_type_id = 1; //Article
            model.AddOnlineChapter.$save()
                .then(function(response) {
                    model.addsection = false;
                    flashMessage = $filter("translate")("Chapter has been added successfully.");
                    flash.set(flashMessage, 'success', false);
                    $scope.disableButton = false;
                    getOnlineCourses();
                })
                .catch(function(error) {

                })
                .finally();

        }

        function addLesson(e, currenItem) {
            e.preventDefault();
            $scope.currenItem = currenItem;
            $scope.currentView = "add";
        }

        function cancelAddLesson(e) {
            e.preventDefault();
            $scope.currentView = "";
        }

        function lessonTitleEdit(e, currenItem, OnlineCourse, lessonType) {
            e.preventDefault();
            if (lessonType === 'chapter') {
                OnlineCourse.showDetailsChapter = !OnlineCourse.showDetailsChapter;
                OnlineCourse.currenItem1 = currenItem;
                $scope.currentView = "edit";
            }
            if (lessonType === 'lesson') {
                OnlineCourse.showDetailsLesson = !OnlineCourse.showDetailsLesson;
                OnlineCourse.currenItemLesson = currenItem;
                $scope.currentLessonView = "edit";
            }

            model.editsection = true;
            getLessonUpdate(currenItem);
        }

        function lessonTitleEditClose(e, currenItem, OnlineCourse, lessonType) {
            if (lessonType === 'chapter') {
                OnlineCourse.showDetailsChapter = '';
            }
            if (lessonType === 'lesson') {
                OnlineCourse.showDetailsLesson = '';
            }
            e.preventDefault();
            $scope.formStatus = 'close';

        }

        function getLessonUpdate(currenItem) {
            OnlineCourseLessonsUpdate.get({
                    id: currenItem
                }).$promise
                .then(function(response) {
                    model.editOnlineChapter = {};
                    model.editOnlineChapter.lesson_name = response.data[0].lesson_name;
                    model.editOnlineChapter.lesson_description = response.data[0].lesson_description;
                });
        }

        function deleteLessonFun(e, lessonID) {
            e.preventDefault();
            model.deleteLesson.id = parseInt(lessonID);
            OnlineCourseLessonsDelete.DeleteOnlineLesson(model.deleteLesson, function(response) {
                if (response.error.code === 0) {
                    succsMsg = $filter("translate")("Deleted successfully.");
                    flash.set(succsMsg, 'success', false);
                }
                getOnlineCourses();
            });
        }

        function getOnlineCourses() {
            if (angular.isDefined($state.params.id) && $state.params.id !== '') {
                var courseArr = {
                    id: $state.params.id,
                    sort: 'display_order',
                    filter: 'all',
                    sort_by: 'ASC',
                    limit: 'all',
                    field: 'id,is_chapter,lesson_name,lesson_description,online_lesson_type_id,filename,article_content,is_video_converting_is_processing,is_lesson_ready_to_view,embed_code'
                };
                OnlineCourseLessons.get(courseArr).$promise
                    .then(function(response) {
                        model.OnlineCourse = response;
                        model.loading = false;
                    });
            } else {
                $scope.$emit('updateParent', {
                    isOn404: true,
                    errorNo: 404
                });
            }
        }
    }]);
    module.controller('ManageCourseBasicsController', ['$state', 'Course', '$scope', '$rootScope', 'ViewCourse', 'Common', 'CourseUpdate', '$location', 'GetLanguages', 'flash', '$filter', 'TokenServiceData', 'UserAll', function($state, Course, $scope, $rootScope, ViewCourse, Common, CourseUpdate, $location, GetLanguages, flash, $filter, TokenServiceData, UserAll) {

        var model = this;
        model.loading = true;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Manage Course Basics");
        var flashMessage = '';
        model.listcourse = new Course();
        model.courseBasic = {};
        model.listcourse = [];
        model.languages = [];
        model.subCategories = [];
        model.instructors = [];

        /**
         * @ngdoc function
         * @name $getSubCategories
         * @function
         *
         * @description
         * 
         * creates sub category dropdown on parent category dropdown change
         */

        GetLanguages.get().$promise.then(function(response) {
            model.languages = response.data;
        });
        if (angular.isDefined($state.params.id) && $state.params.id !== '') {
            ViewCourse.get({
                    id: $state.params.id,
                    field: 'id,title,slug,subtitle,language_id,parent_category_id,category_id,user_id'
                }).$promise
                .then(function(response) {
                    model.loading = false;
                    model.courseBasic.title = response.data[0].title;
                    model.courseBasic.subtitle = response.data[0].subtitle;
                    model.courseBasic.language_id = response.data[0].language_id;
                    model.courseBasic.parent_category_id = response.data[0].parent_category_id;
                    model.courseBasic.category_id = response.data[0].category_id;
                    model.courseBasic.user_id = response.data[0].user_id;
                    Common.get({
                        category_type: "parent",
                        filter: "active",
                        limit: "all",
                        field: "id,category_id,sub_category_name,sub_category"
                    }).$promise.then(function(response) {
                        model.listcourse.category = response.data;
                        getSubCategories();
                    });
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
        model.getSubCategories = getSubCategories;

        function getSubCategories() {
            for (var i = 0; i < model.listcourse.category.length; i++) {
                if (model.listcourse.category[i].id == model.courseBasic.parent_category_id) {
                    model.subCategories = model.listcourse.category[i].sub_category;
                    return i;
                }
            }
            return null;
        }
        model.saveCourseBasic = saveCourseBasic;

        function saveCourseBasic() {
            CoursesID = $state.params.id;
            model.courseBasic.id = CoursesID;
            //model.courseBasic.course_type_id = 1;
            //model.courseBasic.category_id = model.courseBasic.parent_category_id;			
            CourseUpdate.update(model.courseBasic, function(response) {
                flashMessage = $filter("translate")("Course basic detail has been updated successfully.");
                flash.set(flashMessage, 'success', false);
                //$location.path('/manage-course/edit-getting-started/'+CoursesID);
            });

        }
        if (angular.isDefined($rootScope.auth)) {
            if ($rootScope.auth.providertype === 'admin') {
                getAllUser();
            }
        }

        function getAllUser() {
            var params = {};
            params.sort_by = 'ASC';
            params.is_teacher = 1;
            params.field = "displayname,user_id";
            UserAll.getUserAll(params).$promise.then(function(response) {
                model.instructors = response.data;
            });
        }
    }]);
    module.controller('ManageCourseSummaryController', ['$state', 'ViewCourse', 'CourseUpdate', 'flash', '$filter', '$scope', '$rootScope', 'TokenServiceData', function($state, ViewCourse, CourseUpdate, flash, $filter, $scope, $rootScope, TokenServiceData) {
        var model = this;
        model.loading = true;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Manage Course Basics");
        var flashMessage = '';
        model.courseSummary = {};
        if (angular.isDefined($state.params.id) && $state.params.id !== '') {
            ViewCourse.get({
                    id: $state.params.id,
                    field: 'id,description'
                }).$promise
                .then(function(response) {
                    model.courseSummary.description = response.data[0].description;
                    model.loading = false;
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

        model.saveCourseSummary = saveCourseSummary;

        function saveCourseSummary(manage_course_summary) {
            $scope.error = false;
            if (manage_course_summary.summary.$invalid) {
                $scope.info = $filter("translate")("Course could not be updated. Please enter summary.");
                $scope.error = true;
                return;
            }
            model.courseSummary.id = $state.params.id;
            CourseUpdate.update(model.courseSummary, function(response) {
                //$state.reload();
                flashMessage = $filter("translate")("Course summary has been updated successfully.");
                flash.set(flashMessage, 'success', false);
            });
        }
    }]);
    module.controller('ManageCourseImageController', ['$state', 'Course', '$scope', '$rootScope', 'ViewCourse', 'CourseUpdate', '$http', '$timeout', '$sce', 'flash', '$filter', 'GENERAL_CONFIG', 'TokenServiceData', function($state, Course, $scope, $rootScope, ViewCourse, CourseUpdate, $http, $timeout, $sce, flash, $filter, GENERAL_CONFIG, TokenServiceData) {
        var model = this;
        model.loading = true;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Manage Course Image");
        model.course = new Course();
        model.courseImage = {};
        $scope.afterUpload = false;
        model.saveCourseImage = saveCourseImage;
        model.uploadCancel = uploadCancel;
        $scope.preview_picture_filename = '';

        function saveCourseImage() {
            model.courseImage.id = $state.params.id;
            CourseUpdate.update(model.courseImage, function(response) {
                if (response.error.code === 0) {
                    flashMessage = $filter("translate")("Course image has been updated successfully.");
                    flash.set(flashMessage, 'success', false);
                    location.reload(true);
                } else {
                    flashMessage = $filter("translate")("Error on Upload");
                    flash.set(flashMessage, 'error', false);
                }
            });

        }
        if (angular.isDefined($state.params.id) && $state.params.id !== '') {
            ViewCourse.get({
                    id: $state.params.id,
                    field: 'id,title,slug,is_from_mooc_affiliate,image_hash,course_image'
                }).$promise
                .then(function(response) {
                    model.courseImage.id = response.data[0].id;
                    model.courseImage.image_hash = response.data[0].image_hash;
                    model.courseImage.course_image = response.data[0].course_image;
                    model.courseImage.is_from_mooc_affiliate = response.data[0].is_from_mooc_affiliate;
                    model.courseImage.mooc_affiliate_course_link = response.data[0].mooc_affiliate_course_link;
                    model.loading = false;
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

        function uploadCancel() {
            $scope.duringUpload = false;
            $scope.preview_picture_filename = '';
            $state.reload();

        }
        $rootScope.attachments = "";
        var uploadUrl = GENERAL_CONFIG.api_url + 'api/v1/image_upload.json';
        var amt = 40;
        $scope.disableSave = false;
        $scope.uploadFile = function(files) {
            $scope.disableSave = true;
            $scope.afterUpload = false;
            $scope.duringUpload = true;
            var fd = new FormData();
            //Take the first selected file
            fd.append("attachment", files[0]);
            fd.append("course_id", $state.params.id);
            $http.post(uploadUrl, fd, {
                withCredentials: true,
                headers: {
                    'Content-Type': undefined
                },
                transformRequest: angular.identity
            }).success(function(response, status, headers, config) {
                if (response.error.code === 0) {
                    model.courseImage.course_image = (response.filename);
                    $timeout(function() {
                        var str = response.picture_url,
                            replacement = '/';
                        $scope.preview_picture_filename = response.filename;
                        $scope.progressValue = 100;
                    }, 200);
                } else {
                    $scope.duringUpload = false;
                    $("#inputTaskAttachments").val("");
                    delete(model.courseImage.course_image);
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
                $scope.disableSave = false;
            }).error();
        };
    }]);
    module.controller('ManageCoursePromoVideoController', ['$state', 'CourseUpdate', '$scope', '$http', 'flash', '$filter', 'GENERAL_CONFIG', 'ViewCourse', '$rootScope', 'TokenServiceData', function($state, CourseUpdate, $scope, $http, flash, $filter, GENERAL_CONFIG, ViewCourse, $rootScope, TokenServiceData) {
        var model = this;
        model.loading = true;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Manage Course Promo Video");
        model.courseVideo = {};
        if (angular.isDefined($state.params.id) && $state.params.id !== '') {
            ViewCourse.get({
                    id: $state.params.id,
                    field: 'id,video_url,is_promo_video_convert_error,is_promo_video_converting_is_processing,promo_video'
                }).$promise
                .then(function(response) {
                    model.courseVideo.promo_video = response.data[0].promo_video;
                    model.courseVideo.is_promo_video_converting_is_processing = response.data[0].is_promo_video_converting_is_processing;
                    model.courseVideo.is_promo_video_convert_error = response.data[0].is_promo_video_convert_error;
                    model.courseVideo.video_url = response.data[0].video_url;
                    model.loading = false;
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
        model.videoSave = videoSave;
        var uploadUrl = GENERAL_CONFIG.api_url + 'api/v1/image_upload.json';
        $scope.disableSave = false;
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
                    model.courseVideo.promo_video = (response.filename);
                } else {
                    $("#inputTaskAttachments").val("");
                    delete(model.courseVideo.promo_video);
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
                $scope.disableSave = false;
            }).error();

        };

        function videoSave() {
            model.courseVideo.id = $state.params.id;
            delete model.courseVideo.is_promo_video_converting_is_processing;
            delete model.courseVideo.is_promo_video_convert_error;
            delete model.courseVideo.video_url;
            CourseUpdate.update(model.courseVideo, function(response) {
                flashMessage = $filter("translate")("Video uploaded successfully.");
                flash.set(flashMessage, 'success', false);
                $state.reload();
            });

        }

    }]);

    module.controller('ManageCoursePriceController', ['ViewCourse', '$state', 'CourseUpdate', 'flash', '$filter', '$rootScope', 'TokenServiceData', '$scope', function(ViewCourse, $state, CourseUpdate, flash, $filter, $rootScope, TokenServiceData, $scope) {
        var model = this;
        model.loading = true;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Manage Course Price");
        model.coursePrice = {};
        model.priceSave = priceSave;
        if (angular.isDefined($state.params.id) && $state.params.id !== '') {
            ViewCourse.get({
                    id: $state.params.id,
                    field: 'id,price'
                }).$promise
                .then(function(response) {
                    model.coursePrice.price = response.data[0].price;
                    model.loading = false;
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

        function priceSave() {
            model.coursePrice.id = $state.params.id;
            CourseUpdate.update(model.coursePrice, function(response) {
                flashMessage = $filter("translate")("Price has been updated successfully.");
                flash.set(flashMessage, 'success', false);
                $state.reload();
            });

        }
    }]);
    module.controller('ManageCourseDangerZoneController', ['$state', 'Pages', '$filter', 'TokenServiceData', '$rootScope', '$scope', function($state, Pages, $filter, TokenServiceData, $rootScope, $scope) {
        var model = this;
        model.loading = true;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Manage Course Danger Zone");
        model.courseDangerZone = [];
        var slugName = 'danger-zone';
        var params = {};
        params.slug = slugName;
        params.iso2 = $.cookie("currentLocale");
        staticDangerZone();
        $rootScope.$on('changeLanguage', function(event, args) {
            params.iso2 = args.currentLocale;
            staticDangerZone();
        });

        function staticDangerZone() {
            if (angular.isDefined($state.params.id) && $state.params.id !== '') {
                Pages.get(params).$promise
                    .then(function(response) {
                        model.courseDangerZone = response.data[0];
                        model.loading = false;
                    });
            } else {
                $scope.$emit('updateParent', {
                    isOn404: true,
                    errorNo: 404
                });
            }
        }


    }]);
    module.controller('ManageCourseHelpController', ['$state', 'Pages', '$filter', '$rootScope', 'TokenServiceData', '$scope', function($state, Pages, $filter, $rootScope, TokenServiceData, $scope) {
        var model = this;
        model.loading = true;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Manage Course Help");
        model.courseHelp = [];
        var slugName = 'instructor-manage-course-help';
        var params = {};
        params.slug = slugName;
        params.iso2 = $.cookie("currentLocale");
        staticHelp();
        $rootScope.$on('changeLanguage', function(event, args) {
            params.iso2 = args.currentLocale;
            staticDangerZone();
        });

        function staticHelp() {
            if (angular.isDefined($state.params.id) && $state.params.id !== '') {
                Pages.get(params).$promise
                    .then(function(response) {
                        model.courseHelp = response.data[0];
                        model.loading = false;

                    });
            } else {
                $scope.$emit('updateParent', {
                    isOn404: true,
                    errorNo: 404
                });
            }

        }
    }]);

}(angular.module("ace.courses")));
