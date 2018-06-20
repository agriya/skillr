(function(module) {

    module.controller('UserProfileController', ['$state', 'User', 'UserProfile', '$scope', '$rootScope', '$location', '$http', '$timeout', 'flash', '$filter', 'TokenService', 'GENERAL_CONFIG', 'TokenServiceData', function($state, User, UserProfile, $scope, $rootScope, $location, $http, $timeout, flash, $filter, TokenService, GENERAL_CONFIG, TokenServiceData) {
        var model = this;
        var promise = TokenService.promise;
        var promiseSettings = TokenService.promiseSettings;
        promiseSettings.then(function(data) {
            if (angular.isDefined(data['ace.seo'])) {
                $scope.loadSeo = data['ace.seo'];
            }
        });
        $rootScope.activeMenu = 'settings';
        model.user_profile = getUser();

        function getUser() {
            if ($rootScope.auth) {
                User.getUser({
                        id: $rootScope.auth.id,
                        field: 'id,displayname,designation,headline,biography,website,youtube_profile_link,linkedin_profile_link,facebook_profile_link,twitter_profile_link,google_plus_profile_link'
                    }).$promise
                    .then(function(response) {
                        model.user_profile = response.data[0];
                        if (model.user_profile) {
                            $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + model.user_profile.displayname;
                        } else {
                            $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("User");
                        }
                        delete model.user_profile.user_image;
                    });
            }
        }

        $scope.afterUpload = false;
        model.uploadCancel = uploadCancel;

        function uploadCancel() {
            $scope.duringUpload = false;
            $state.reload();

        }
        $rootScope.attachments = "";
        var uploadUrl = GENERAL_CONFIG.api_url + 'api/v1/image_upload.json';
        $scope.disableSave = false;
        $scope.uploadFile = function(files) {
            $scope.disableSave = true;
            $scope.afterUpload = false;
            $scope.duringUpload = true;
            var fd = new FormData();
            //Take the first selected file
            fd.append("attachment", files[0]);
            $http.post(uploadUrl, fd, {
                withCredentials: true,
                headers: {
                    'Content-Type': undefined
                },
                transformRequest: angular.identity
            }).success(function(response, status, headers, config) {
                if (response.error.code === 0) {
                    model.user_profile.user_image = (response.filename);
                } else {
                    $scope.duringUpload = false;
                    delete(model.user_profile.user_image);
                    $("#inputTaskAttachments").val("");
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

        $scope.editProfile = function() {
            UserProfile.update(model.user_profile, function(response) {
                if (response.error.code === 0) {
                    _cookieAuth.displayname = model.user_profile.displayname;
                    if (angular.isDefined(response.data) && angular.isDefined(response.data.image_hash)) {
                        model.user_profile.image_hash = response.data.image_hash;
                        _cookieAuth.userImageHash = model.user_profile.image_hash;
                    }
                    flashMessage = $filter("translate")("User profile has been updated successfully.");
                    flash.set(flashMessage, 'success', false);
                    location.reload(true);
                    $.cookie('auth', JSON.stringify(_cookieAuth), {
                        path: '/'
                    });
                } else {
                    flash.set(response.error.message, 'error', false);
                }

            });
        };

    }]);
    module.controller('UserAllController', ['UserAll', '$rootScope', '$scope', '$location', '$state', '$filter', 'TokenServiceData', function(UserAll, $rootScope, $scope, $location, $state, $filter, TokenServiceData) {
        var model = this;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Instructors");
        model.userall = [];
        params = {};
        params.limit = 10;

        function getAllUser(element) {
            params.page = $scope.currentPage;
            params.sort_by = 'ASC';
            params.is_teacher = 1;
            params.field = "image_hash,displayname,user_id,designation,biography";
            UserAll.getUserAll(params).$promise.then(function(response) {
                model.userall = response;
                $scope._metadata = response._metadata;
            });
            if (element !== null && angular.isDefined(element)) {
                $('html, body').animate({
                    scrollTop: $(element).offset().top
                }, 2000, 'swing', false);
            }
        }
        $scope.index = function(element) {
            $scope.currentPage = ($scope.currentPage !== undefined) ? parseInt($scope.currentPage) : 1;
            getAllUser(element);
        };
        $scope.index(null);
        $scope.paginate = function(element) {
            $scope.currentPage = parseInt($scope.currentPage);
            $scope.index(element);
        };
    }]);
    module.controller('SubscribePlansController', ['$scope', '$state', '$rootScope', '$filter', 'TokenServiceData', function($scope, $state, $rootScope, $filter, TokenServiceData) {
        var title = $filter("to_trusted")("Plans & Sign Up");
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + title;
    }]);

}(angular.module("ace.users")));
