(function(module) {
    module.controller('userLoginController', ['$state', '$window', 'User', '$scope', 'Login', 'SessionService', '$rootScope', '$location', 'flash', '$filter', '$modal', '$modalStack', 'pageType', 'TokenServiceData', 'GENERAL_CONFIG', 'expireCookie', function($state, $window, User, $scope, Login, SessionService, $rootScope, $location, flash, $filter, $modal, $modalStack, pageType, TokenServiceData, GENERAL_CONFIG, expireCookie) {
        var model = this;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Log in");
        model.user = {};
        model.loading = false;
        $scope.modalClose = function(e) {
            e.preventDefault();
            $scope.$close();
        };
        $scope.currentPageType = pageType;

        $scope.contentInIframe = false;
        if (self !== top) {
            $scope.contentInIframe = true;
        }
        $scope.modalForgotPassword = function(e) {
            e.preventDefault();
            if (angular.isUndefined($rootScope.modal) || !$rootScope.modal) {
                $modal.open({
                    scope: $scope,
                    templateUrl: 'users/forgot_password.tpl.html',
                    controller: 'forgotPasswordController',
                    size: 'lg',
                    resolve: {
                        pageType: function() {
                            return "modal";
                        }
                    }
                }).result.then(function(result) {
                    $rootScope.modal = false;
                    //$scope.$close();
                }, function(result) {
                    $rootScope.modal = false;
                    //$scope.dismiss();
                }).finally(function() {
                    $rootScope.modal = false;
                    // handle finally
                });
                $rootScope.modal = true;
            }
        };
        $scope.goToState = function(state, params) {
            $modalStack.dismissAll();
            $state.go(state, params);
        };
        $scope.modalSignup = function(e) {
            e.preventDefault();
            if (angular.isUndefined($rootScope.modal) || !$rootScope.modal) {
                $modal.open({
                    scope: $scope,
                    templateUrl: 'users/signup.tpl.html',
                    controller: 'userSignupController',
                    resolve: {
                        pageType: function() {
                            return "modal";
                        },
                        TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                            var promiseSettings = TokenService.promiseSettings;
                            return $q.all({
                                load: promiseSettings.then(function(data) {
                                    if (angular.isDefined(data['ace.socialLogin']) && $ocLazyLoad.getModules().indexOf('ace.socialLogin') === -1) {
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
        $scope.loginUser = function(userAdd, user) {
            if (userAdd) {
                $scope.disableButton = true;
                $scope.user = user;
                Login.login($scope.user, function(response) {
                    $scope.response = response;
                    if (!angular.isUndefined($scope.response.error) && $scope.response.error.code === 0) {
                        $scope.disableButton = false;
                        SessionService.setUserAuthenticated(true);
                        Auth = {};
                        Auth.id = $scope.response.user.id;
                        Auth.providertype = $scope.response.user.providertype;
                        Auth.accesstoken = $scope.response.user.accesstoken;
                        Auth.displayname = $scope.response.user.displayname;
                        Auth.designation = $scope.response.user.designation;
                        Auth.headline = $scope.response.user.headline;
                        Auth.user_image_hash = $scope.response.user.image_hash;
                        Auth.token = $scope.response.user.token;
                        Auth.site_url = GENERAL_CONFIG.api_url;
                        _cookieAuth = {};
                        _cookieAuth.id = Auth.id;
                        _cookieAuth.providertype = Auth.providertype;
                        _cookieAuth.accesstoken = Auth.accesstoken;
                        _cookieAuth.displayname = Auth.displayname;
                        _cookieAuth.token = Auth.token;
                        _cookieAuth.designation = Auth.designation;
                        _cookieAuth.headline = Auth.headline;
                        _cookieAuth.userImageHash = Auth.user_image_hash;
						
                        if (Auth.providertype == "admin") {
                            enabledPlugin = $rootScope.settings['site.enabled_plugins'];
                            $.cookie('enabled_plugins', enabledPlugin, {
                                path: '/'
                            });
                        }
                        token = $scope.response.access_token;
                        $.cookie('auth', JSON.stringify(_cookieAuth), {
							expires: expireCookie.getDate(),
                            path: '/'
                        });
                        $.cookie('token', token, {
							expires: expireCookie.getDate(),
                            path: '/'
                        });
                        $.cookie('refresh_token', $scope.response.refresh_token, {
							expires: expireCookie.getDate(),
                            path: '/'
                        });
                        $rootScope.auth = Auth;
                        $scope.isAuth = true;
                        $rootScope.isAuth = true;
                        $rootScope.isUser = false;
                        $scope.$emit('updateParent', {
                            isAuth: true,
                            auth: Auth,
                            isUser: $rootScope.isUser
                        });
                        // refreshing header and become an instructor
                        $scope.$emit('refreshHeader', {
                            isAuth: true,
                        });
                        $rootScope.$emit('checkIsTeacher', {

                        });
                        var redirectto = $location.absUrl().split('/#!/');
                        if (Auth.providertype == "admin") {
                            redirectpath = redirectto[0] + '/ag-admin';
                            window.location.href = redirectpath;
                        } else {
                            if (redirectto[1] === "" || redirectto[1] === "users/login" || redirectto[1] === "users/forgot_password" || redirectto[1] === "users/signup?subscription_id" || redirectto[1] === "users/signup") {
                                $location.path('/my-courses/learning').replace();
                            }else{
								$state.reload();
							}
							$modalStack.dismissAll();							
                        }
                    } else {
                        $scope.disableButton = false;
                        SessionService.setUserAuthenticated(false);
                        $scope.isAuth = false;
                        $rootScope.isAuth = false;
                        $scope.user.password = "";
                        errrorMsg = $filter("translate")($scope.response.error.message);
                        if ($scope.response.error.code === 7) {
                            errrorMsg = $filter("translate")("Account has not been activated. Please find activation link in your email.");
                        } else if ($scope.response.error.code === 1) {
                            errrorMsg = $filter("translate")("Sorry, login failed. Email or Password is incorrect.");
                        } else {
                            errrorMsg = $filter("translate")($scope.response.error.message);
                        }
                        flash.set(errrorMsg, 'error', false);
                    }
                });
            }
        };
        if ($scope.isAuth) {
            $location.path('#!/my-courses/learning');
        }
    }]);
}(angular.module("ace.users")));
