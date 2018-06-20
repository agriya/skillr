(function(app) {
    var Auth = Array();
    app.config(['$stateProvider', '$urlRouterProvider', '$translateProvider', '$ocLazyLoadProvider', 'GENERAL_CONFIG', function($stateProvider, $urlRouterProvider, $translateProvider, $ocLazyLoadProvider, GENERAL_CONFIG) {
        $urlRouterProvider.otherwise('/');
        //$translateProvider.translations('en', translations).preferredLanguage('en');
        $translateProvider.useStaticFilesLoader({
            prefix: 'assets/js/l10n/',
            suffix: '.json'
        });
        $translateProvider.preferredLanguage(GENERAL_CONFIG.preferredLanguage);
        $translateProvider.useLocalStorage(); // saves selected language to localStorage
        // Enable escaping of HTML
        $translateProvider.useSanitizeValueStrategy('escape');
        //	$translateProvider.useCookieStorage();
    }]);
    app.config(['$authProvider', 'GENERAL_CONFIG', function($authProvider, GENERAL_CONFIG) {
        if (self !== top) {
            var url = GENERAL_CONFIG.api_url + 'api/v1/providers.json';
            var params = {};
            $.get(url, params, function(response) {
                var credentials = {};
                var url=GENERAL_CONFIG.api_url;
                angular.forEach(response.data, function(res, i) {
                    credentials = {
                        clientId: res.api_key,
                        redirectUri: url + 'api/v1/auth.json?type=' + angular.lowercase(res.name)
                    };
                    if (res.name === 'Facebook') {
                        $authProvider.facebook(credentials);
                    }
                    if (res.name === 'Google') {
                        $authProvider.google(credentials);
                    }
                    if (res.name === 'Twitter') {
                        $authProvider.twitter({
                            url: url + 'api/v1/auth.json?type=' + angular.lowercase(res.name)
                        });
                    }
                });
            });
        }
    }]);
    app.run(['$rootScope', '$translate', 'SessionService', '$location', '$modalStack', '$window', '$auth', '$timeout', 'GENERAL_CONFIG', 'ImgLazyLoad', function($rootScope, $translate, SessionService, $location, $modalStack, $window, $auth, $timeout, GENERAL_CONFIG, ImgLazyLoad) {
        $rootScope.is_fresh_call = 1;
        $rootScope.ImgLazyLoad = ImgLazyLoad;
        $rootScope.GENERAL_CONFIG = GENERAL_CONFIG;
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            $rootScope.isAuth = $rootScope.isAuth;
            $rootScope.pageBool = true;
            if (angular.isDefined(toState.url)) {
                $rootScope.isHome = false;
                $rootScope.isCourse = false;
                $rootScope.currentURL = toState.url;
                if (toState.url === '/') {
                    $rootScope.isHome = true;
                    //redirect to home, if user logged in
                    if ($rootScope.isAuth) {
                        $rootScope.isHome = false;
                        $location.path('/courses/search').replace();
                    }
                }
                if (toState.url === '/course/{id}/{slug}') {
                    $rootScope.isCourse = true;
                }
            }
            if (toState.url.indexOf('/users/signup?subscription_id') !== -1 || toState.url.indexOf('/users/login') !== -1 || toState.url.indexOf('/users/forgot_password') !== -1) {
                if ($rootScope.isAuth) {
                    $location.path('/');
                }
            }

            if (angular.isDefined(toState.data.activetab)) {
                $rootScope.activetab = toState.data.activetab;
            }

            $rootScope.status = '';
            $rootScope.is_home_page = false;

            if (toState.name === 'home') {
                $rootScope.is_home_page = true;
            }
            var exception_arr = ['/', '/users/signup?subscription_id', '/course/{id}/{slug}', '/users/login', '/courses', '/users/activation/:id/:hash/:ex_token', '/users/forgot_password', '/courses/search?category_id&q&price&instructionLevel&language&sort', '/subscribe/plans', '/users', '/user/{id}/{slug}/', '/courses/category/{id}/{slug}', '/social-login', '/social-login/email', '/{slug}/learn/{id}?lesson', '/page/{slug}', '/contactus', '/error/:id'];

            if (angular.isDefined(toState.url)) {
                if ($.inArray(toState.url, exception_arr) === -1 && !SessionService.getUserAuthenticated()) {
                    $location.path('/');
                }
            }
            if (toState.url.indexOf('/users/signup?subscription_id') !== -1 || toState.url.indexOf('/users/login') !== -1 || toState.url.indexOf('/users/forgot_password') !== -1) {
                $rootScope.$broadcast('updateParent', {
                    is_login: true
                });
            } else {
                $rootScope.$broadcast('updateParent', {
                    is_login: false
                });
            }

        });
        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
            $rootScope.success_state_name = toState.name;
            $rootScope.success_state_params = toParams;
            $modalStack.dismissAll();
        });
        $rootScope.$on('$viewContentLoaded', function() {
            if (!$('#preloader').hasClass('loadAG')) {
                $('#status').fadeOut(600);
                $('#preloader').delay(600).fadeOut(600 / 2);
            }
        });
        if (self !== top) {
            var url = GENERAL_CONFIG.api_url + 'api/v1/providers.json';
            var params = {};
            var clientId = '';
            $.get(url, params, function(response) {
                angular.forEach(response.data, function(res, i) {
                    if (res.name === 'Facebook') {
                        clientId = res.api_key;
                    }
                });
                $window.fbAsyncInit = function() {
                    FB.init({
                        appId: clientId,
                        channelUrl: 'app/channel.html',
                        status: true,
                        version: 'v2.5',
                        cookie: true,
                        xfbml: true
                    });
                    watchLoginChange();
                };
                (function(d) {
                    // load the Facebook javascript SDK

                    var js,
                        id = 'facebook-jssdk',
                        ref = d.getElementsByTagName('script')[0];

                    if (d.getElementById(id)) {
                        return;
                    }
                    js = d.createElement('script');
                    js.id = id;
                    js.async = true;
                    js.src = "//connect.facebook.net/en_US/sdk.js";

                    ref.parentNode.insertBefore(js, ref);

                }(document));

                watchLoginChange = function() {
                    var _self = this;
                    FB.getLoginStatus(function(response) {
                        if (response.status === 'connected') {
                            if (!$.cookie('refresh_token')) {
                                $auth.authenticate('facebook');
                            }
                        } else {
                            if ($.cookie('refresh_token')) {
                                SessionService.setUserAuthenticated(false);
                                Auth = Array();
                                $rootScope.isAuth = false;
                                $.removeCookie('auth');
                                $.removeCookie('token');
                                $.removeCookie('refresh_token');
                                $.removeCookie('isUser');
                                $.removeCookie('enabled_plugins');
                                location.reload(true);
                            }
                        }
                    });
                };
            });
        }
    }]);

    app.controller('AppController', ['$scope', 'SessionService', '$rootScope', 'GENERAL_CONFIG', function($scope, SessionService, $rootScope, GENERAL_CONFIG) {
		GENERAL_CONFIG.api_url = window.location.protocol + '//' + window.location.host + GENERAL_CONFIG.api_url;		
		if (angular.isDefined($.cookie('auth')) && $.cookie('auth') !== null && !SessionService.getUserAuthenticated()) {
            SessionService.setUserAuthenticated(true);
            // fetch the cookie value and set it back in Auth variable in each refresh of window
            _cookieAuth = JSON.parse($.cookie('auth'));
            Auth.id = _cookieAuth.id;
            Auth.providertype = _cookieAuth.providertype;
            Auth.accesstoken = _cookieAuth.accesstoken;
            Auth.displayname = _cookieAuth.displayname;
            Auth.headline = _cookieAuth.headline;
            Auth.designation = _cookieAuth.designation;
            Auth.user_image_hash = _cookieAuth.userImageHash;
            Auth.token = _cookieAuth.token;
            Auth.site_url = GENERAL_CONFIG.api_url;
            $scope.auth = Auth;
            $rootScope.auth = $scope.auth;
            token = $.cookie('token');
            $scope.isAuth = true;
            $scope.$emit('updateParent', {
                isAuth: true
            });
        }
        $rootScope.site_url = GENERAL_CONFIG.api_url;
    }]);

    app.config(['$httpProvider',
        function($httpProvider) {
            $httpProvider.interceptors.push('interceptor');
            $httpProvider.interceptors.push('themeSwitchEngine');
            $httpProvider.interceptors.push('oauthTokenInjector');
            // to fix ie9 get request cache issues
            $httpProvider.defaults.headers.common = {};
            $httpProvider.defaults.headers.common["Cache-Control"] = "no-cache";
            $httpProvider.defaults.headers.common.Pragma = "no-cache";
            $httpProvider.defaults.headers.common["If-Modified-Since"] = "0";
        }
    ]);

    app.factory('interceptor', ['$q', '$location', '$injector', '$rootScope', 'SessionService', 'flash', '$window', '$timeout', 'PendingRequestsService', 'GENERAL_CONFIG', '$filter', function($q, $location, $injector, $rootScope, SessionService, flash, $window, $timeout, PendingRequestsService, GENERAL_CONFIG, $filter) {
        return {
            // On response success
            response: function(response) {
                if (angular.isDefined(response.data)) {
                    if (angular.isDefined(response.data.error_message) && parseInt(response.data.error) === 1 && response.data.error_message === 'Authentication failed') {
                        SessionService.setUserAuthenticated(false);
                        Auth = Array();
                        token = '';
                        $.removeCookie('auth');
                        $.removeCookie('token');
                        $.removeCookie('refresh_token');
                        $.removeCookie('enabled_plugins');
                        window.location.href = window.location.protocol + '//' + window.location.host + window.location.pathname;
                    }
                    // If thrid party network not return email address means we need to get it from user.
                    if (angular.isDefined(response.data.thrid_party_login_no_email)) {
                        $rootScope.$broadcast('getEmailFromUser', {
                            thrid_party_profile: response.data.thrid_party_profile,
                        });
                    }
                    // For thrid party login
                    if (angular.isDefined(response.data.thrid_party_login)) {
                        if (angular.isDefined(response.data.error)) {
                            if (angular.isDefined(response.data.error.code) && parseInt(response.data.error.code) === 0) {
                                // If error code 0 means logined succesfully. So set the returned user details in Auth variable and also in cookies. So if you refresh the window means, Auth variable will reset. To handle this we fetch the cookies value and set it back to the Auth.
                                SessionService.setUserAuthenticated(true);
                                Auth = {};
                                Auth.id = response.data.user.id;
                                Auth.providertype = response.data.user.providertype;
                                Auth.accesstoken = response.data.user.accesstoken;
                                Auth.displayname = response.data.user.displayname;
                                Auth.designation = response.data.user.designation;
                                Auth.headline = response.data.user.headline;
                                Auth.user_image_hash = response.data.user.image_hash;
                                Auth.token = response.data.user.token;
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
                                token = response.data.access_token;
								var expireCookie = $injector.get('expireCookie');
                                $.cookie('auth', JSON.stringify(_cookieAuth), {
									expires: expireCookie.getDate(),
                                    path: '/'
                                });
                                $.cookie('token', token, {
									expires: expireCookie.getDate(),
                                    path: '/'
                                });
                                $.cookie('refresh_token', response.data.refresh_token, {
									expires: expireCookie.getDate(),
                                    path: '/'
                                });
                                $rootScope.auth = Auth;
                                $rootScope.isAuth = true;
                                $rootScope.isUser = false;
                                // refreshing header and become an instructor
                                $rootScope.$emit('refreshHeader', {
                                    isAuth: true,
                                });
                                $rootScope.$emit('checkIsTeacher', {

                                });
                                var redirectto = $location.absUrl().split('/#!/');
                                if (Auth.providertype == "admin") {
                                    redirectpath = redirectto[0] + '/ag-admin';
                                    window.location.href = redirectpath;
                                } else {
                                    var promise;
                                    promise = $.get(GENERAL_CONFIG.api_url + 'api/v1/settings.json', {
                                        limit: 'all'
                                    });
                                    promise.then(function(settingsData) {
                                        settingsResponse = angular.fromJson(settingsData);
                                        if (settingsResponse.data) {
                                            var enabledPlugins = '';
                                            $.each(settingsResponse.data, function(i, settingData) {
                                                if (settingData.name === 'site.enabled_plugins') {
                                                    enabledPlugins = settingData.value;
                                                }
                                            });
                                            if (enabledPlugins.indexOf('Subscriptions') > -1 && response.data.already_register === '0') {
                                                redirectpath = '/subscribe/plans';
                                            } else {
                                                redirectpath = '/my-courses/learning';
                                            }
                                            var modalService = $injector.get('$modalStack');
                                            modalService.dismissAll();
                                            $location.path(redirectpath).replace();
                                        }
                                    });
                                }
                            } else {
                                flash.set(response.data.error.message, 'error', false);
                            }
                        }
                    }
                    // When the reseponse is returned from thrid party connection means we need to refresh the connection  icons in settings page .
                    if (angular.isDefined(response.data.thrid_party_connection)) {
                        if (angular.isDefined(response.data.error.code) && parseInt(response.data.error.code) === 0) {
                            flash.set('Successfully connected to ' + response.data.provider_name, 'success', false);
                            $rootScope.$broadcast('reloadConnectBlock', {
                                update_profile_image: (parseInt(response.data.thrid_party_provider_id) === 1) ? true : false,
                            });
                        } else {
                            flash.set(response.data.error.message, 'error', false);
                        }
                    }
                }
                PendingRequestsService.remove({
                    url: response.config.url
                });
                // Return the response or promise.
                return response || $q.when(response);
            },

            // On response failture
            responseError: function(response) {
                // Return the promise rejection.
                if (response.status !== 200) {
                    $rootScope.$emit('websiteEmit', {
                        errorNo: response.status
                    });
                }
                return $q.reject(response);
            }
        };
    }]);

    app.factory('themeSwitchEngine', ['$rootScope', '$timeout', 'GENERAL_CONFIG',
        function($rootScope, $timeout, GENERAL_CONFIG) {
            var themeSwitchEngine = {
                request: function(config) {
                    if (config.url.indexOf('.tpl.html') !== -1 && config.url.indexOf('plugins/') === -1) {
                        config.url = 'themes/' + GENERAL_CONFIG.theme + '/views/' + config.url;
                    }
                    return config;
                }
            };
            return themeSwitchEngine;
        }
    ]);

    app.factory('oauthTokenInjector', ['$rootScope', '$timeout', '$q', 'PendingRequestsService',
        function($rootScope, $timeout, $q, PendingRequestsService) {
            var oauthTokenInjector = {
                request: function(config) {
                    if (config.url.indexOf('.json') !== -1) {
                        if (token) {
                            var sep = config.url.indexOf('?') === -1 ? '?' : '&';
                            config.url = config.url + sep + 'token=' + token;
                        }
                    }
                    var canceller = $q.defer();
                    config.timeout = canceller.promise;
                    PendingRequestsService.add({
                        url: config.url,
                        canceller: canceller
                    });
                    return config;
                }
            };
            return oauthTokenInjector;
        }
    ]);

    /**
     * @ngdoc service
     * @name PendingRequestsService
     * @description
     * To find how many request are pending and cancel the pending the request
     *
     *
     **/
    app.service('PendingRequestsService', function() {
        var pending = [];
        this.get = function() {
            return pending;
        };
        this.add = function(request) {
            pending.push(request);
        };
        this.remove = function(request) {
            angular.forEach(pending, function(p, i) {
                if (p.url === request.url) {
                    pending.splice(i, 1);
                }
            });
        };
        this.cancelAll = function() {
            if (pending !== undefined) {
                angular.forEach(pending, function(p) {
                    p.canceller.resolve();
                });
                pending = [];
            }
        };
    });
    app.service('SessionService', ['$rootScope', function($rootScope) {
        var userIsAuthenticated = false;
        this.setUserAuthenticated = function(value) {
            userIsAuthenticated = value;
        };

        this.getUserAuthenticated = function() {
            return userIsAuthenticated;
        };

        var unregisterUpdateParent = $rootScope.$on('updateParent', function(event, args) {
            if (args.isAuth !== undefined) {
                $rootScope.isAuth = args.isAuth;
            }
            if (args.menu) {
                $rootScope.menu = args.menu;
            }
            if (args.auth !== undefined) {
                $rootScope.auth = args.auth;
            }
            if (args.isShowDropMenu !== undefined) {
                $rootScope.isShowDropMenu = args.isShowDropMenu;
            }
            if (args.edit_temp !== undefined) {
                $rootScope.edit_temp = args.edit_temp;
            }
            if (args.isOn404 !== undefined) {
                $rootScope.isOn404 = args.isOn404;
            } else {
                $rootScope.isOn404 = false;
            }
            if (args.errorNo !== undefined) {
                $rootScope.errorNo = args.errorNo;
            }
            if (args.connect_flash_message !== undefined) {
                $rootScope.connect_flash_message = args.connect_flash_message;
            }
            if (args.parentGenres !== undefined) {
                if (parseInt(Auth.is_onboarding_showed) === 0) {

                }
            }
        });

    }]);
    /**
     * @ngdoc function
     * @name $growlProvider
     * @function
     *
     * @description
     * Automatic closing of notifications (timeout, ttl)
     *
     */
    app.config(['growlProvider', function(growlProvider) {
        growlProvider.onlyUniqueMessages(true);
        growlProvider.globalTimeToLive(5000);
        //growlProvider.globalEnableHtml(true);
    }]);

    // flash message set & get
    app.factory('flash', ['$rootScope', 'growl', function($rootScope, growl) {
        return {
            set: function(message, type, isStateChange) {
                if (type === 'success') {
                    growl.addSuccessMessage(message);
                } else if (type === 'error') {
                    if (isStateChange === true) {
                        growl.addErrorMessage(message, {
                            ttl: -1
                        });
                    } else {
                        growl.addErrorMessage(message);
                    }
                } else if (type === 'info') {
                    growl.addInfoMessage(message);
                } else if (type === 'Warning') {
                    growl.addWarnMessage(message);
                }
            }
        };
    }]);

    /**
     * @ngdoc directive
     * @name match
     * @description
     *  To match the new password and  confirm password field text when typing on it
     *
     *
     **/
    app.directive('match', function() {
        return {
            require: 'ngModel',
            restrict: 'A',
            scope: {
                match: '='
            },
            link: function(scope, elem, attrs, ctrl) {
                scope.$watch(function() {
                    var modelValue = ctrl.$modelValue || ctrl.$$invalidModelValue;
                    return (ctrl.$pristine && angular.isUndefined(modelValue)) || scope.match === modelValue;
                }, function(currentValue) {
                    ctrl.$setValidity('match', currentValue);
                });
            }
        };
    });

    app.directive('header', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation hereafter	

        };
        return {
            restrict: 'A',
            templateUrl: 'common/header.tpl.html',
            link: linker,
            controller: 'HeaderController as model',
            scope: {
                header: '=',
            }
        };
    });
    app.directive('footer', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation hereafter	

        };
        return {
            restrict: 'A',
            templateUrl: 'common/footer.tpl.html',
            link: linker,
            controller: 'footerController as model',
            scope: {
                footer: '=',
            }
        };
    });
    app.filter('to_trusted', ['$sce', function($sce) {
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    }]);

    app.service('TokenService', ['$sce', '$rootScope', '$q', 'GENERAL_CONFIG', '$ocLazyLoad', function($sce, $rootScope, $q, GENERAL_CONFIG, $ocLazyLoad) {
        var promise;
        var promiseSettings;
        var isCheckAdmin = $rootScope.auth ? $rootScope.auth.providertype : '';
        var _params = {};
        if (angular.isUndefined('token') || token === '' && (!$.cookie('token'))) {
            promise = $.get(GENERAL_CONFIG.api_url + 'api/v1/token.json', _params, function(tokenData) {
                tokenData = angular.fromJson(tokenData);
                if (angular.isDefined(tokenData.access_token)) {
                    token = tokenData.access_token;
                }
            });

        } else {
            promise = true;
        }

        if ($rootScope.is_fresh_call) {
            if (angular.isUndefined($rootScope.settings)) {
                $rootScope.settings = {};
            }
            promiseSettings = $.get(GENERAL_CONFIG.api_url + 'api/v1/settings.json', {
                limit: 'all'
            }, function(settingsData) {
                settingsResponse = angular.fromJson(settingsData);
                if (settingsResponse.data) {
                    var enabledPlugins = '';
                    $.each(settingsResponse.data, function(i, settingData) {
                        $rootScope.settings[settingData.name] = settingData.value;
                        if (settingData.name === 'site.enabled_plugins') {
                            enabledPlugins = settingData.value;
                            $rootScope.enabledPlugins = settingData.value;
                        }
                    });
                    //var enabledPluginsArray = enabledPlugins.split(',');
                    if (enabledPlugins.indexOf('SocialLogins') > -1) {
                        settingsData['ace.socialLogin'] = {
                            serie: true,
                            name: 'ace.socialLogin',
                            files: ['src/app/plugins/SocialLogins/SocialLogins.js'],
                            template: ['src/app/plugins/SocialLogins/socialLogins.tpl.html', 'src/app/plugins/SocialLogins/getEmailFromUser.tpl.html']
                        };
                    }
                    if (enabledPlugins.indexOf('CourseCheckout') > -1) {
                        settingsData['ace.CourseCheckout'] = {
                            serie: true,
                            name: 'ace.CourseCheckout',
                            files: ['src/app/plugins/CourseCheckout/CourseCheckout.js'],
                            template: ['src/app/plugins/CourseCheckout/payment.tpl.html', 'src/app/plugins/CourseCheckout/buyButton.tpl.html', 'src/app/plugins/CourseCheckout/transactions.tpl.html']
                        };
                    }
                    if (enabledPlugins.indexOf('RatingAndReview') > -1) {
                        settingsData['ace.ratingAndReview'] = {
                            serie: true,
                            name: 'ace.ratingAndReview',
                            files: ['src/app/plugins/RatingAndReview/RatingAndReview.js'],
                            template: ['src/app/plugins/RatingAndReview/courseFeedback.tpl.html', 'src/app/plugins/RatingAndReview/courseFeedback.tpl.html',
                                'src/app/plugins/RatingAndReview/ratingAndReviewForm.tpl.html', 'src/app/plugins/RatingAndReview/studentSatisfaction.tpl.html',
                                'src/app/plugins/RatingAndReview/ratingStars.tpl.html', 'src/app/plugins/RatingAndReview/studentSatisfactionButton.tpl.html'
                            ]
                        };
                    }
                    if (enabledPlugins.indexOf('Withdrawal') > -1) {

                        settingsData['ace.withdrawal'] = {
                            serie: true,
                            name: 'ace.withdrawal',
                            files: ['src/app/plugins/Withdrawal/Withdrawal.js']
                        };
                    }
                    if (enabledPlugins.indexOf('ArticleLessons') > -1) {
                        settingsData['ace.articlelesson'] = {
                            serie: true,
                            name: 'ace.articlelesson',
                            files: ['src/app/plugins/ArticleLessons/ArticleLessons.js'],
                            template: ['src/app/plugins/ArticleLessons/articleLessonsForm.tpl.html']
                        };
                    }
                    if (enabledPlugins.indexOf('VideoLessons') > -1) {
                        settingsData['ace.videolesson'] = {
                            serie: true,
                            name: 'ace.videolesson',
                            files: ['src/app/plugins/VideoLessons/VideoLessons.js'],
                            template: ['src/app/plugins/VideoLessons/videoLessonsForm.tpl.html']
                        };
                    }
                    if (enabledPlugins.indexOf('DownloadableFileLessons') > -1) {
                        settingsData['ace.downloadblefilelesson'] = {
                            serie: true,
                            name: 'ace.downloadblefilelesson',
                            files: ['src/app/plugins/DownloadableFileLessons/DownloadableFileLessons.js'],
                            template: ['src/app/plugins/DownloadableFileLessons/downloadableFileLessonsForm.tpl.html']
                        };
                    }
                    if (enabledPlugins.indexOf('VideoExternalEmbedLessons') > -1) {
                        settingsData['ace.videoembedorexternallesson'] = {
                            serie: true,
                            name: 'ace.videoembedorexternallesson',
                            files: ['src/app/plugins/VideoExternalEmbedLessons/VideoExternalEmbedLessons.js'],
                            template: ['src/app/plugins/VideoExternalEmbedLessons/videoExternalEmbedLessonsForm.tpl.html']
                        };
                    }
                    if (enabledPlugins.indexOf('SocialShare') > -1) {
                        settingsData['ace.socialShare'] = {
                            serie: true,
                            name: 'ace.socialShare',
                            files: ['src/app/plugins/SocialShare/SocialShare.js'],
                            template: ['src/app/plugins/SocialShare/socialShare.tpl.html']
                        };
                    }
                    if (enabledPlugins.indexOf('Subscriptions') > -1) {
                        settingsData['ace.subscriptions'] = {
                            serie: true,
                            name: 'ace.subscriptions',
                            files: ['src/app/plugins/Subscriptions/Subscriptions.js'],
                            template: ['src/app/plugins/Subscriptions/subscriptionsPayment.tpl.html', 'src/app/plugins/Subscriptions/mySubscription.tpl.html', 'src/app/plugins/Subscriptions/subscriptionsPlans.tpl.html']
                        };
                    }
                    if (enabledPlugins.indexOf('Payout') > -1) {
                        settingsData['ace.payout'] = {
                            serie: true,
                            name: 'ace.payout',
                            files: ['src/app/plugins/Payout/Payout.js'],
                            template: ['src/app/plugins/Payout/payout.tpl.html', 'src/app/plugins/Payout/payoutButton.tpl.html']
                        };
                    }
                    if (enabledPlugins.indexOf('SEO') > -1) {
                        settingsData['ace.seo'] = {
                            serie: true,
                            name: 'ace.seo',
                            files: ['src/app/plugins/SEO/SEO.js'],
                            template: ['src/app/plugins/SEO/userProfileSeo.tpl.html', 'src/app/plugins/SEO/courseSeo.tpl.html']
                        };
                    }
                    if (enabledPlugins.indexOf('CourseWishlist') > -1) {
                        settingsData['ace.courseWishlist'] = {
                            serie: true,
                            name: 'ace.courseWishlist',
                            files: ['src/app/plugins/CourseWishlist/CourseWishlist.js'],
                            template: ['src/app/plugins/CourseWishlist/CourseWishlistByUser.tpl.html', 'src/app/plugins/CourseWishlist/courseWishlist.tpl.html']
                        };
                    }
                    if (enabledPlugins.indexOf('UserProfile') > -1) {
                        settingsData['ace.userprofile'] = {
                            serie: true,
                            name: 'ace.userprofile',
                            files: ['src/app/plugins/UserProfile/UserProfile.js'],
                            template: ['src/app/plugins/UserProfile/userProfile.tpl.html']
                        };
                    }
                    if (enabledPlugins.indexOf('Instructor') > -1 || isCheckAdmin === 'admin') {
                        settingsData['ace.instructor'] = {
                            serie: true,
                            name: 'ace.instructor',
                            files: ['src/app/plugins/Instructor/Instructor.js'],
                            template: ['src/app/plugins/Instructor/InstructorCourses.tpl.html']
                        };
                    }
                    if (enabledPlugins.indexOf('Analytics') > -1) {
                        settingsData['ace.analytics'] = {
                            serie: true,
                            name: 'ace.analytics',
                            files: ['src/app/plugins/Analytics/Analytics.js'],
                            template: []
                        };
                        if ($rootScope.settings['analytics.is_enabled_google_analytics'] === '1' || $rootScope.settings['analytics.is_enabled_facebook_pixel'] === '1') {
                            $rootScope.loadanalytics = settingsData['ace.analytics'];
                        }
                    }
                    if (enabledPlugins.indexOf('Comments') > -1) {
                        settingsData['ace.comments'] = {
                            serie: true,
                            name: 'ace.comments',
                            files: ['src/app/plugins/Comments/Comments.js'],
                            template: []
                        };
                    }
                    if (enabledPlugins.indexOf('Coupons') > -1) {
                        settingsData['ace.coupons'] = {
                            serie: true,
                            name: 'ace.coupons',
                            files: ['src/app/plugins/Coupons/Coupons.js'],
                            template: ['src/app/plugins/Coupons/courseCoupon.tpl.html', 'src/app/plugins/Coupons/courseCouponButton.tpl.html']
                        };
                    }
                    if (enabledPlugins.indexOf('Banner') > -1) {
                        settingsData['ace.banner'] = {
                            serie: true,
                            name: 'ace.banner',
                            files: ['src/app/plugins/Banner/Banner.js'],
                            template: ['src/app/plugins/Banner/banner.tpl.html']
                        };
                        if ($ocLazyLoad.getModules().indexOf('ace.banner') === -1) {
                            $ocLazyLoad.load(settingsData['ace.banner'], {
                                cache: true
                            });
                        }
                    }
                    if (enabledPlugins.indexOf('Translations') > -1) {
                        settingsData['ace.translations'] = {
                            serie: true,
                            name: 'ace.translations',
                            files: ['src/app/plugins/Translations/Translations.js'],
                            template: ['src/app/plugins/Translations/languageTranslate.tpl.html']
                        };
                        $rootScope.loadTranslations = settingsData['ace.translations'];
                    }

                }
            });

        } else {
            promiseSettings = true;
        }
        return {
            promise: promise,
            promiseSettings: promiseSettings
        };
    }]);

    /**
     * @ngdoc module
     * @name HashBangURLs
     *
     * @description
     * To change location with #!
     *
     */
    angular.module('HashBangURLs', []).config(['$locationProvider', function($locationProvider) {
        $locationProvider.hashPrefix('!');
    }]);

    angular.module('OcLazyLoad', ['oc.lazyLoad']).config(['$ocLazyLoadProvider', function($ocLazyLoadProvider) {
        $ocLazyLoadProvider.config({
            debug: false,
            cache: true,
            events: true
        });
    }]);
    /** to avoid autoscroll="true" issues when header is not fixed **/
    app.config(['$uiViewScrollProvider', function($uiViewScrollProvider) {
        $uiViewScrollProvider.useAnchorScroll();
    }]);
    /** time ago filter using jquery timeago plugin **/
    app.filter("timeago", ['$rootScope', function($rootScope) {
        var timeZone = ($rootScope.settings['site.timezone']) ? $rootScope.settings['site.timezone'] : '+0000';
        return function(date) {
            jQuery.timeago.settings.strings = {
                prefixAgo: null,
                prefixFromNow: null,
                suffixAgo: "ago",
                suffixFromNow: "from now",
                seconds: "less than a minute",
                minute: "a minute",
                minutes: "%d minutes",
                hour: "an hour",
                hours: "%d hours",
                day: "a day",
                days: "%d days",
                month: "a month",
                months: "%d months",
                year: "a year",
                years: "%d years",
                wordSeparator: " ",
                numbers: []
            };
            return jQuery.timeago(date + timeZone);
        };
    }]);
    app.filter('bytes', function() {
        return function(MB, precision) {
            if (MB === 0) {
                return '0 MB';
            }
            if (isNaN(parseFloat(MB)) || !isFinite(MB)) return '-';
            if (typeof precision === 'undefined') precision = 1;

            var units = ['MB', 'GB', 'TB', 'PB'],
                number = Math.floor(Math.log(MB) / Math.log(1024)),
                val = (MB / Math.pow(1024, Math.floor(number))).toFixed(precision);

            return (val.match(/\.0*$/) ? val.substr(0, val.indexOf('.')) : val) + ' ' + units[number];
        };
    });
    app.config(
        ['$animateProvider',
            function($animateProvider) {
                $animateProvider.classNameFilter(/carousel/);
            }
        ]);
	app.factory('expireCookie', function(){
		return {
			getDate: function(str) {
				var date = new Date();
				var minutes = 60;
				date.setTime(date.getTime() + (minutes * 60 * 1000));
				return date;
			}
		};
	});

}(angular.module("ace", [
    'ace.Constant',
    'ace.home',
    'templates-app',
    'templates-common',
    'ui.router.state',
    'ui.router',
    'ui.bootstrap',
    'pascalprecht.translate',
    'ace.common',
    'ace.courses',
    'HashBangURLs',
    'slugifier',
    'ace.users',
    'angular-growl',
    'ngMessages',
    'ngSanitize',
    'ngCookies',
    'nl2br',
    'http-auth-interceptor',
    'textAngular',
    'ui.sortable',
    'ngAnimate',
    'oc.lazyLoad',
    'satellizer',
    '720kb.socialshare',
    'ace.contactUs',
    'ace.pages',
    'me-lazyload'
])));
