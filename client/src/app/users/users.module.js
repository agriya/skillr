(function(module) {

    module.config(['$stateProvider', '$analyticsProvider', function($stateProvider, $analyticsProvider) {
        var getToken = {
            'TokenServiceData': function(TokenService) {
                return TokenService.promiseSettings;
            },
            'pageType': function() {
                return "page";
            }
        };
        $stateProvider
            .state('Signup', {
                url: '/users/signup?subscription_id',
                views: {
                    'main@': {
                        controller: 'userSignupController as model',
                        templateUrl: 'users/signup.tpl.html'
                    }
                },
                data: {

                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.socialLogin']) && $ocLazyLoad.getModules().indexOf('ace.socialLogin') === -1) {
                                    requiredPlugins.push(data['ace.socialLogin']);
                                }
                                if (angular.isDefined(data['ace.subscriptions']) && $ocLazyLoad.getModules().indexOf('ace.subscriptions') === -1) {
                                    requiredPlugins.push(data['ace.subscriptions']);
                                }
                                if (requiredPlugins.length > 0) {
                                    return $ocLazyLoad.load(requiredPlugins, {
                                        cache: true
                                    });
                                } else {
                                    return '';
                                }
                            })
                        });
                    }],
                    'pageType': function() {
                        return "page";
                    }
                }
            })

        .state('Login', {
                url: '/users/login',
                views: {
                    'main@': {
                        controller: 'userLoginController as model',
                        templateUrl: 'users/login.tpl.html'
                    }
                },
                data: {

                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
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
                    }],
                    'pageType': function() {
                        return "page";
                    }
                }
            })
            .state('Logout', {
                url: '/users/logout',
                views: {
                    'main@': {
                        controller: 'userLogoutController as model',
                        templateUrl: 'users/logout.tpl.html'
                    }
                },
                data: {

                },
                resolve: getToken
            })
            .state('UserActivation', {
                url: '/users/activation/:id/:hash/:ex_token',
                views: {
                    'main@': {
                        controller: 'userActivationController as model',
                        templateUrl: 'users/activation.tpl.html'
                    }
                },
                data: {},
                resolve: getToken
            })
            .state('ForgotPassword', {
                url: '/users/forgot_password',
                views: {
                    'main@': {
                        controller: 'forgotPasswordController as model',
                        templateUrl: 'users/forgot_password.tpl.html'
                    }
                },
                data: {},
                resolve: getToken
            })
            .state('ChangePassword', {
                url: '/users/change_password',
                views: {
                    'main@': {
                        controller: 'changePasswordController as model',
                        templateUrl: 'users/change_password.tpl.html'
                    }
                },
                data: {

                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.userprofile']) && $ocLazyLoad.getModules().indexOf('ace.userprofile') === -1) {
                                    requiredPlugins.push(data['ace.userprofile']);
                                }
                                if (requiredPlugins.length > 0) {
                                    return $ocLazyLoad.load(requiredPlugins, {
                                        cache: true
                                    });
                                } else {
                                    return '';
                                }
                            })
                        });
                    }],
                    'pageType': function() {
                        return "page";
                    }
                }
            })
            .state('UserProfile', {
                url: '/users/edit-profile',
                views: {
                    'main@': {
                        controller: 'UserProfileController as model',
                        templateUrl: 'users/user_profile.tpl.html'
                    }
                },
                data: {

                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.userprofile']) && $ocLazyLoad.getModules().indexOf('ace.userprofile') === -1) {
                                    requiredPlugins.push(data['ace.userprofile']);
                                }

                                if (requiredPlugins.length > 0) {
                                    return $ocLazyLoad.load(requiredPlugins, {
                                        cache: true
                                    });
                                } else {
                                    return '';
                                }
                            })
                        });
                    }],
                    'pageType': function() {
                        return "page";
                    }
                }
            })
            .state('AllUser', {
                url: '/users',
                views: {
                    'main@': {
                        controller: 'UserAllController as model',
                        templateUrl: 'users/all_user.tpl.html'
                    }
                },
                data: {},
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.userprofile']) && $ocLazyLoad.getModules().indexOf('ace.userprofile') === -1) {
                                    requiredPlugins.push(data['ace.userprofile']);
                                }
                                if (requiredPlugins.length > 0) {
                                    return $ocLazyLoad.load(requiredPlugins, {
                                        cache: true
                                    });
                                } else {
                                    return '';
                                }
                            })
                        });
                    }],
                    'pageType': function() {
                        return "page";
                    }
                }
            })
            .state('SubscribePlans', {
                url: '/subscribe/plans',
                views: {
                    'main@': {
                        controller: 'SubscribePlansController as model',
                        templateUrl: 'users/subscribe_plans.tpl.html'
                    }
                },
                data: {},
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.subscriptions']) && $ocLazyLoad.getModules().indexOf('ace.subscriptions') === -1) {
                                    requiredPlugins.push(data['ace.subscriptions']);
                                }
                                if (requiredPlugins.length > 0) {
                                    return $ocLazyLoad.load(requiredPlugins, {
                                        cache: true
                                    });
                                } else {
                                    return '';
                                }
                            })
                        });
                    }],
                    'pageType': function() {
                        return "page";
                    }
                }
            });
    }]);

}(angular.module('ace.users', [
    'ui.router',
    'ngResource',
    'ace.courses',
    'OcLazyLoad',
    'angulartics',
    'angulartics.google.analytics',
    'angulartics.facebook.pixel',
    'ace.home'
])));

(function(module) {

    module.config(['$stateProvider', '$analyticsProvider', function($stateProvider, $analyticsProvider) {
        var getToken = {
            'TokenServiceData': function(TokenService) {
                return TokenService.promiseSettings;
            },
            'pageType': function() {
                return "page";
            }
        };
        $stateProvider
            .state('Signup', {
                url: '/users/signup?subscription_id',
                views: {
                    'main@': {
                        controller: 'userSignupController as model',
                        templateUrl: 'users/signup.tpl.html'
                    }
                },
                data: {

                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.socialLogin']) && $ocLazyLoad.getModules().indexOf('ace.socialLogin') === -1) {
                                    requiredPlugins.push(data['ace.socialLogin']);
                                }
                                if (angular.isDefined(data['ace.subscriptions']) && $ocLazyLoad.getModules().indexOf('ace.subscriptions') === -1) {
                                    requiredPlugins.push(data['ace.subscriptions']);
                                }
                                if (requiredPlugins.length > 0) {
                                    return $ocLazyLoad.load(requiredPlugins, {
                                        cache: true
                                    });
                                } else {
                                    return '';
                                }
                            })
                        });
                    }],
                    'pageType': function() {
                        return "page";
                    }
                }
            })

        .state('Login', {
                url: '/users/login',
                views: {
                    'main@': {
                        controller: 'userLoginController as model',
                        templateUrl: 'users/login.tpl.html'
                    }
                },
                data: {

                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
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
                    }],
                    'pageType': function() {
                        return "page";
                    }
                }
            })
            .state('Logout', {
                url: '/users/logout',
                views: {
                    'main@': {
                        controller: 'userLogoutController as model',
                        templateUrl: 'users/logout.tpl.html'
                    }
                },
                data: {

                },
                resolve: getToken
            })
            .state('UserActivation', {
                url: '/users/activation/:id/:hash/:ex_token',
                views: {
                    'main@': {
                        controller: 'userActivationController as model',
                        templateUrl: 'users/activation.tpl.html'
                    }
                },
                data: {},
                resolve: getToken
            })
            .state('ForgotPassword', {
                url: '/users/forgot_password',
                views: {
                    'main@': {
                        controller: 'forgotPasswordController as model',
                        templateUrl: 'users/forgot_password.tpl.html'
                    }
                },
                data: {},
                resolve: getToken
            })
            .state('ChangePassword', {
                url: '/users/change_password',
                views: {
                    'main@': {
                        controller: 'changePasswordController as model',
                        templateUrl: 'users/change_password.tpl.html'
                    }
                },
                data: {

                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.userprofile']) && $ocLazyLoad.getModules().indexOf('ace.userprofile') === -1) {
                                    requiredPlugins.push(data['ace.userprofile']);
                                }
                                if (requiredPlugins.length > 0) {
                                    return $ocLazyLoad.load(requiredPlugins, {
                                        cache: true
                                    });
                                } else {
                                    return '';
                                }
                            })
                        });
                    }],
                    'pageType': function() {
                        return "page";
                    }
                }
            })
            .state('UserProfile', {
                url: '/users/edit-profile',
                views: {
                    'main@': {
                        controller: 'UserProfileController as model',
                        templateUrl: 'users/user_profile.tpl.html'
                    }
                },
                data: {

                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.userprofile']) && $ocLazyLoad.getModules().indexOf('ace.userprofile') === -1) {
                                    requiredPlugins.push(data['ace.userprofile']);
                                }

                                if (requiredPlugins.length > 0) {
                                    return $ocLazyLoad.load(requiredPlugins, {
                                        cache: true
                                    });
                                } else {
                                    return '';
                                }
                            })
                        });
                    }],
                    'pageType': function() {
                        return "page";
                    }
                }
            })
            .state('AllUser', {
                url: '/users',
                views: {
                    'main@': {
                        controller: 'UserAllController as model',
                        templateUrl: 'users/all_user.tpl.html'
                    }
                },
                data: {},
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.userprofile']) && $ocLazyLoad.getModules().indexOf('ace.userprofile') === -1) {
                                    requiredPlugins.push(data['ace.userprofile']);
                                }
                                if (requiredPlugins.length > 0) {
                                    return $ocLazyLoad.load(requiredPlugins, {
                                        cache: true
                                    });
                                } else {
                                    return '';
                                }
                            })
                        });
                    }],
                    'pageType': function() {
                        return "page";
                    }
                }
            })
            .state('SubscribePlans', {
                url: '/subscribe/plans',
                views: {
                    'main@': {
                        controller: 'SubscribePlansController as model',
                        templateUrl: 'users/subscribe_plans.tpl.html'
                    }
                },
                data: {},
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.subscriptions']) && $ocLazyLoad.getModules().indexOf('ace.subscriptions') === -1) {
                                    requiredPlugins.push(data['ace.subscriptions']);
                                }
                                if (requiredPlugins.length > 0) {
                                    return $ocLazyLoad.load(requiredPlugins, {
                                        cache: true
                                    });
                                } else {
                                    return '';
                                }
                            })
                        });
                    }],
                    'pageType': function() {
                        return "page";
                    }
                }
            });
    }]);

}(angular.module('ace.users', [
    'ui.router',
    'ngResource',
    'ace.courses',
    'OcLazyLoad',
    'angulartics',
    'angulartics.google.analytics',
    'angulartics.facebook.pixel',
    'ace.home'
])));
