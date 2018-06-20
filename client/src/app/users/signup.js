(function(module) {

    module.controller('userSignupController', ['$window', 'User', '$scope', '$state', 'SessionService', 'flash', '$location', 'Signup', '$rootScope', '$filter', 'pageType', 'Subscriptions', 'TokenServiceData', '$modal', 'FreeTrailFormData', '$modalStack', 'expireCookie', function($window, User, $scope, $state, SessionService, flash, $location, Signup, $rootScope, $filter, pageType, Subscriptions, TokenServiceData, $modal, FreeTrailFormData, $modalStack, expireCookie) {
        var model = this;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Sign up");
        if (FreeTrailFormData.get().displayname !== undefined) {
            $scope.user = {};
            $scope.user.displayname = FreeTrailFormData.get().displayname;
            $scope.user.email = FreeTrailFormData.get().email;
        }
        model.user = new User();
        $scope.subscriptionId = '';
        $scope.subscriptionId = $state.params.subscription_id;
        model.Subscriptions = [];
        model.SubscriptionsList = [];
        model.Subscriptions.id = $state.params.subscription_id ? parseInt($state.params.subscription_id) : '';

        $scope.contentInIframe = false;
        if (self !== top) {
            $scope.contentInIframe = true;
        }

        Subscriptions.get().$promise
            .then(function(response) {
                model.SubscriptionsList = response.data;
                if ($rootScope.settings['site.enabled_plugins'].indexOf('Subscriptions') > -1) {
                    if (model.Subscriptions.id === '' || angular.isUndefined(model.Subscriptions.id)) {
                        model.Subscriptions.id = response.data[0].id;
                    }
                }
            });

        $scope.modalClose = function(e) {
            e.preventDefault();
            $scope.$close();
        };
        $scope.currentPageType = pageType;

        $scope.goToState = function(state, params) {
            $modalStack.dismissAll();
            $state.go(state, params);
        };

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

        $scope.showForm = false;
        $scope.onSubmitted = function(user) {
            $scope.disableButton = true;
            $scope.user = user;
            $scope.user.is_agree_terms_conditions = 1;
            $scope.user.displayname = $scope.user.displayname;
            $scope.user.subscription_id = model.Subscriptions.id;
            _cookieAuth = {};
            _cookieAuth.subscription_id = $scope.user.subscription_id;
            delete $scope.user.subscription_id;

            Signup.register($scope.user, function(response) {
                $scope.response = response;
                if (_cookieAuth.subscription_id !== '' && _cookieAuth.subscription_id !== undefined && $rootScope.settings['site.enabled_plugins'].indexOf('Subscriptions') > -1) {
                    if (!angular.isUndefined($scope.response.error) && $scope.response.error.code === 0) {
                        $scope.disableButton = false;
                        $.removeCookie('from_check_subscribe_mail');
                        SessionService.setUserAuthenticated(true);
                        succsMsg = $filter("translate")("You have successfully registered with our site and your activation mail has been sent to your mail inbox. Please confirm your email for next login.");
                        flash.set(succsMsg, 'success', false);
                        Auth = {};
                        Auth.id = $scope.response.user.id;
                        Auth.providertype = $scope.response.user.providertype;
                        Auth.accesstoken = $scope.response.user.accesstoken;
                        Auth.displayname = $scope.response.user.displayname;
                        Auth.designation = $scope.response.user.designation;
                        Auth.headline = $scope.response.user.headline;
                        Auth.user_image_hash = $scope.response.user.image_hash;
                        Auth.token = $scope.response.user.token;
                        _cookieAuth.id = Auth.id;
                        _cookieAuth.providertype = Auth.providertype;
                        _cookieAuth.accesstoken = Auth.accesstoken;
                        _cookieAuth.displayname = Auth.displayname;
                        _cookieAuth.email = Auth.email;
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
                        if (angular.isDefined(_cookieAuth.subscription_id)) {
                            redirectpath = redirectto[0] + '/#!/subscribe/payment/' + _cookieAuth.subscription_id;
                        } else {
                            redirectpath = redirectto[0] + '/#!/my-courses/learning';
                        }
                        window.location.href = redirectpath;
                    } else {
                        $scope.disableButton = false;
                        SessionService.setUserAuthenticated(false);
                        $scope.isAuth = false;
                        $scope.user.password = "";
                        $scope.user.confirm_password = "";
                        if (response.error.code === 1) {
                            errorMsg = $filter("translate")("Sorry, registration failed.  Email already exist.");
                        } else {
                            errorMsg = $filter("translate")($scope.response.error.message);
                        }
                        flash.set(errorMsg, 'error', false);
                    }
                } else {
                    if (!angular.isUndefined($scope.response.error) && $scope.response.error.code === 0) {
                        $scope.disableButton = false;
                        SessionService.setUserAuthenticated(false);
                        flashMessage = $filter("translate")("You have successfully registered with our site and your activation mail has been sent to your mail inbox. Please confirm your email for login.");
                        flash.set(flashMessage, 'success', false);
                        $location.path('users/login');
                    } else {
                        $scope.disableButton = false;
                        SessionService.setUserAuthenticated(false);
                        $scope.isAuth = false;
                        $scope.user.password = "";
                        $scope.user.confirm_password = "";
                        if (response.error.code === 1) {
                            errorMsg = $filter("translate")("Sorry, registration failed.  Email already exist.");
                        } else {
                            errorMsg = $filter("translate")($scope.response.error.message);
                        }
                        flash.set(errorMsg, 'error', false);
                    }
                }
            });
        };
    }]);

}(angular.module("ace.users")));
