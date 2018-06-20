/**
 * Each module has a <moduleName>.module.js file.  This file contains the angular module declaration -
 * angular.module("moduleName", []);
 * The build system ensures that all the *.module.js files get included prior to any other .js files, which
 * ensures that all module declarations occur before any module references.
 */
(function(module) {
    module.config(['$stateProvider', '$analyticsProvider', function($stateProvider, $analyticsProvider) {
        var getToken = {
            'TokenServiceData': function(TokenService) {
                return TokenService.promiseSettings;
            }
        };
        $stateProvider
            .state('home', {
                url: '/',
                views: {
                    "main": {
                        controller: 'HomeController as model',
                        templateUrl: 'home/home.tpl.html'
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
                                if (angular.isDefined(data['ace.ratingAndReview']) && $ocLazyLoad.getModules().indexOf('ace.ratingAndReview') === -1) {
                                    requiredPlugins.push(data['ace.ratingAndReview']);
                                }
                                if (angular.isDefined(data['ace.subscriptions']) && $ocLazyLoad.getModules().indexOf('ace.subscriptions') === -1) {
                                    requiredPlugins.push(data['ace.subscriptions']);
                                }
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
                    }]
                }
            }) //Plugin routes defined here to avoid oclazyload page refresh problem
            .state('MeSubscription', {
                url: '/me/subscriptions?error_code&error_message&subscription_id',
                views: {
                    'main@': {
                        controller: 'MeSubscriptionController as model',
                        templateUrl: 'src/app/plugins/Subscriptions/mySubscription.tpl.html'
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

                    }]
                }
            })
            .state('subscribe', {
                url: '/subscribe/payment/{id}',
                views: {
                    'main@': {
                        controller: 'subscribePaymentController as model',
                        templateUrl: 'src/app/plugins/Subscriptions/subscriptionsPayment.tpl.html'
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
                    }]
                }
            })
            .state('buyCourse', {
                url: '/course/{id}/payment/',
                views: {
                    'main@': {
                        controller: 'paymentController as model',
                        templateUrl: 'src/app/plugins/CourseCheckout/payment.tpl.html'
                    }
                },
                data: {},
                resolve: {
                    pageType: function() {
                        return "page";
                    },
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.CourseCheckout']) && $ocLazyLoad.getModules().indexOf('ace.CourseCheckout') === -1) {
                                    requiredPlugins.push(data['ace.CourseCheckout']);
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

                    }]
                }
            })
            .state('Seo', {
                url: '/manage-course/seo/{id}',
                views: {
                    'main@': {
                        controller: 'SeoUpdateController as model',
                        templateUrl: 'src/app/plugins/SEO/courseSeo.tpl.html'
                    }
                },
                data: {
                    activetab: 'seo'
                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.seo']) && $ocLazyLoad.getModules().indexOf('ace.seo') === -1) {
                                    requiredPlugins.push(data['ace.seo']);
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

                    }]
                }
            })
            .state('manageCoursePayment', {
                url: '/manage-course/payout/:id?error_code&error_message&sudopay_gateway_id',
                views: {
                    'main@': {
                        controller: 'payoutController as model',
                        templateUrl: 'src/app/plugins/Payout/payout.tpl.html'
                    }
                },
                data: {
                    activetab: 'payout'
                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.payout']) && $ocLazyLoad.getModules().indexOf('ace.payout') === -1) {
                                    requiredPlugins.push(data['ace.payout']);
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
                    }]
                }
            })
            .state('courseRating', {
                url: '/course-rating/{id}',
                views: {
                    'main@': {
                        controller: 'ratingController as model',
                        templateUrl: 'src/app/plugins/RatingAndReview/ratingAndReviewForm.tpl.html'
                    }
                },
                data: {},
                resolve: {
                    pageType: function() {
                        return "page";
                    },
                    rating: function() {
                        return "";
                    },
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.ratingAndReview']) && $ocLazyLoad.getModules().indexOf('ace.ratingAndReview') === -1) {
                                    requiredPlugins.push(data['ace.ratingAndReview']);
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

                    }]
                }
            })
            .state('studentSatisfaction', {
                url: '/manage-course/satisfaction-analytics/{id}',
                views: {
                    'main@': {
                        controller: 'studentSatisfactionController as model',
                        templateUrl: 'src/app/plugins/RatingAndReview/studentSatisfaction.tpl.html'
                    }
                },
                data: {
                    activetab: 'coursestudtsatisfaction'
                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.ratingAndReview']) && $ocLazyLoad.getModules().indexOf('ace.ratingAndReview') === -1) {
                                    requiredPlugins.push(data['ace.ratingAndReview']);
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
                    }]
                }
            })
            .state('sociallogin', {
                url: '/social-login',
                views: {
                    'main@': {
                        controller: 'SocialLoginController as model',
                        templateUrl: 'src/app/plugins/SocialLogins/socialLogins.tpl.html'
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
                                if (angular.isDefined(data['ace.socialLogin']) && $ocLazyLoad.getModules().indexOf('ace.socialLogin') === -1) {
                                    requiredPlugins.push(data['ace.socialLogin']);
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
                    }]
                }
            })
            .state('socialLoginEmail', {
                url: '/social-login/email',
                views: {
                    'main@': {
                        controller: 'SocialLoginEmailController as model',
                        templateUrl: 'src/app/plugins/SocialLogins/getEmailFromUser.tpl.html'
                    }
                },
                data: {},
                resolve: {
                    pageType: function() {
                        return "page";
                    },
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
                                if (requiredPlugins.length > 0) {
                                    return $ocLazyLoad.load(requiredPlugins, {
                                        cache: true
                                    });
                                } else {
                                    return '';
                                }
                            })
                        });
                    }]
                }
            })
            .state('moneyTransfer', {
                url: '/user_cash_withdrawals',
                views: {
                    'main@': {
                        controller: 'moneyTransferController as model',
                        templateUrl: 'src/app/plugins/Withdrawal/moneyTransfer.tpl.html'
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
                                if (angular.isDefined(data['ace.withdrawal']) && $ocLazyLoad.getModules().indexOf('ace.withdrawal') === -1) {
                                    requiredPlugins.push(data['ace.withdrawal']);
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
                    }]
                }
            })
            .state('moneyTransferAdd', {
                url: '/user_cash_withdrawals/add',
                views: {
                    'main@': {
                        controller: 'moneyTransferAddController as model',
                        templateUrl: 'src/app/plugins/Withdrawal/moneyTransferAdd.tpl.html'
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
                                if (angular.isDefined(data['ace.withdrawal']) && $ocLazyLoad.getModules().indexOf('ace.withdrawal') === -1) {
                                    requiredPlugins.push(data['ace.withdrawal']);
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
                    }]
                }
            })
            .state('users', {
                url: '/user/{id}/{slug}/',
                views: {
                    'main@': {
                        controller: 'UserController as model',
                        templateUrl: 'src/app/plugins/UserProfile/userProfile.tpl.html'
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
                    }]
                }
            })
            .state('Coupon', {
                url: '/manage-course/coupon/{id}',
                views: {
                    'main@': {
                        controller: 'CouponController as model',
                        templateUrl: 'src/app/plugins/Coupons/courseCoupon.tpl.html'
                    }
                },
                data: {
                    activetab: 'coupons'
                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.coupons']) && $ocLazyLoad.getModules().indexOf('ace.coupons') === -1) {
                                    requiredPlugins.push(data['ace.coupons']);
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
                    }]
                }
            })
            .state('transaction', {
                url: '/transactions',
                views: {
                    'main@': {
                        controller: 'transactionsController as model',
                        templateUrl: 'src/app/plugins/CourseCheckout/transactions.tpl.html'
                    }

                },
                data: {},
                resolve: {
                    pageType: function() {
                        return "page";
                    },
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.CourseCheckout']) && $ocLazyLoad.getModules().indexOf('ace.CourseCheckout') === -1) {
                                    requiredPlugins.push(data['ace.CourseCheckout']);
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

                    }]
                }
            });
    }]);

    // The name of the module, followed by its dependencies (at the bottom to facilitate enclosure)
}(angular.module("ace.home", [
    'ui.router',
    'angulartics',
    'angulartics.google.analytics',
    'angulartics.facebook.pixel'
])));

/**
 * Each module has a <moduleName>.module.js file.  This file contains the angular module declaration -
 * angular.module("moduleName", []);
 * The build system ensures that all the *.module.js files get included prior to any other .js files, which
 * ensures that all module declarations occur before any module references.
 */
(function(module) {
    module.config(['$stateProvider', '$analyticsProvider', function($stateProvider, $analyticsProvider) {
        var getToken = {
            'TokenServiceData': function(TokenService) {
                return TokenService.promiseSettings;
            }
        };
        $stateProvider
            .state('home', {
                url: '/',
                views: {
                    "main": {
                        controller: 'HomeController as model',
                        templateUrl: 'home/home.tpl.html'
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
                                if (angular.isDefined(data['ace.ratingAndReview']) && $ocLazyLoad.getModules().indexOf('ace.ratingAndReview') === -1) {
                                    requiredPlugins.push(data['ace.ratingAndReview']);
                                }
                                if (angular.isDefined(data['ace.subscriptions']) && $ocLazyLoad.getModules().indexOf('ace.subscriptions') === -1) {
                                    requiredPlugins.push(data['ace.subscriptions']);
                                }
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
                    }]
                }
            }) //Plugin routes defined here to avoid oclazyload page refresh problem
            .state('MeSubscription', {
                url: '/me/subscriptions?error_code&error_message&subscription_id',
                views: {
                    'main@': {
                        controller: 'MeSubscriptionController as model',
                        templateUrl: 'src/app/plugins/Subscriptions/mySubscription.tpl.html'
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

                    }]
                }
            })
            .state('subscribe', {
                url: '/subscribe/payment/{id}',
                views: {
                    'main@': {
                        controller: 'subscribePaymentController as model',
                        templateUrl: 'src/app/plugins/Subscriptions/subscriptionsPayment.tpl.html'
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
                    }]
                }
            })
            .state('buyCourse', {
                url: '/course/{id}/payment/',
                views: {
                    'main@': {
                        controller: 'paymentController as model',
                        templateUrl: 'src/app/plugins/CourseCheckout/payment.tpl.html'
                    }
                },
                data: {},
                resolve: {
                    pageType: function() {
                        return "page";
                    },
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.CourseCheckout']) && $ocLazyLoad.getModules().indexOf('ace.CourseCheckout') === -1) {
                                    requiredPlugins.push(data['ace.CourseCheckout']);
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

                    }]
                }
            })
            .state('Seo', {
                url: '/manage-course/seo/{id}',
                views: {
                    'main@': {
                        controller: 'SeoUpdateController as model',
                        templateUrl: 'src/app/plugins/SEO/courseSeo.tpl.html'
                    }
                },
                data: {
                    activetab: 'seo'
                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.seo']) && $ocLazyLoad.getModules().indexOf('ace.seo') === -1) {
                                    requiredPlugins.push(data['ace.seo']);
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

                    }]
                }
            })
            .state('manageCoursePayment', {
                url: '/manage-course/payout/:id?error_code&error_message&sudopay_gateway_id',
                views: {
                    'main@': {
                        controller: 'payoutController as model',
                        templateUrl: 'src/app/plugins/Payout/payout.tpl.html'
                    }
                },
                data: {
                    activetab: 'payout'
                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.payout']) && $ocLazyLoad.getModules().indexOf('ace.payout') === -1) {
                                    requiredPlugins.push(data['ace.payout']);
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
                    }]
                }
            })
            .state('courseRating', {
                url: '/course-rating/{id}',
                views: {
                    'main@': {
                        controller: 'ratingController as model',
                        templateUrl: 'src/app/plugins/RatingAndReview/ratingAndReviewForm.tpl.html'
                    }
                },
                data: {},
                resolve: {
                    pageType: function() {
                        return "page";
                    },
                    rating: function() {
                        return "";
                    },
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.ratingAndReview']) && $ocLazyLoad.getModules().indexOf('ace.ratingAndReview') === -1) {
                                    requiredPlugins.push(data['ace.ratingAndReview']);
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

                    }]
                }
            })
            .state('studentSatisfaction', {
                url: '/manage-course/satisfaction-analytics/{id}',
                views: {
                    'main@': {
                        controller: 'studentSatisfactionController as model',
                        templateUrl: 'src/app/plugins/RatingAndReview/studentSatisfaction.tpl.html'
                    }
                },
                data: {
                    activetab: 'coursestudtsatisfaction'
                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.ratingAndReview']) && $ocLazyLoad.getModules().indexOf('ace.ratingAndReview') === -1) {
                                    requiredPlugins.push(data['ace.ratingAndReview']);
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
                    }]
                }
            })
            .state('sociallogin', {
                url: '/social-login',
                views: {
                    'main@': {
                        controller: 'SocialLoginController as model',
                        templateUrl: 'src/app/plugins/SocialLogins/socialLogins.tpl.html'
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
                                if (angular.isDefined(data['ace.socialLogin']) && $ocLazyLoad.getModules().indexOf('ace.socialLogin') === -1) {
                                    requiredPlugins.push(data['ace.socialLogin']);
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
                    }]
                }
            })
            .state('socialLoginEmail', {
                url: '/social-login/email',
                views: {
                    'main@': {
                        controller: 'SocialLoginEmailController as model',
                        templateUrl: 'src/app/plugins/SocialLogins/getEmailFromUser.tpl.html'
                    }
                },
                data: {},
                resolve: {
                    pageType: function() {
                        return "page";
                    },
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
                                if (requiredPlugins.length > 0) {
                                    return $ocLazyLoad.load(requiredPlugins, {
                                        cache: true
                                    });
                                } else {
                                    return '';
                                }
                            })
                        });
                    }]
                }
            })
            .state('moneyTransfer', {
                url: '/user_cash_withdrawals',
                views: {
                    'main@': {
                        controller: 'moneyTransferController as model',
                        templateUrl: 'src/app/plugins/Withdrawal/moneyTransfer.tpl.html'
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
                                if (angular.isDefined(data['ace.withdrawal']) && $ocLazyLoad.getModules().indexOf('ace.withdrawal') === -1) {
                                    requiredPlugins.push(data['ace.withdrawal']);
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
                    }]
                }
            })
            .state('moneyTransferAdd', {
                url: '/user_cash_withdrawals/add',
                views: {
                    'main@': {
                        controller: 'moneyTransferAddController as model',
                        templateUrl: 'src/app/plugins/Withdrawal/moneyTransferAdd.tpl.html'
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
                                if (angular.isDefined(data['ace.withdrawal']) && $ocLazyLoad.getModules().indexOf('ace.withdrawal') === -1) {
                                    requiredPlugins.push(data['ace.withdrawal']);
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
                    }]
                }
            })
            .state('users', {
                url: '/user/{id}/{slug}/',
                views: {
                    'main@': {
                        controller: 'UserController as model',
                        templateUrl: 'src/app/plugins/UserProfile/userProfile.tpl.html'
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
                    }]
                }
            })
            .state('Coupon', {
                url: '/manage-course/coupon/{id}',
                views: {
                    'main@': {
                        controller: 'CouponController as model',
                        templateUrl: 'src/app/plugins/Coupons/courseCoupon.tpl.html'
                    }
                },
                data: {
                    activetab: 'coupons'
                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.coupons']) && $ocLazyLoad.getModules().indexOf('ace.coupons') === -1) {
                                    requiredPlugins.push(data['ace.coupons']);
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
                    }]
                }
            })
            .state('transaction', {
                url: '/transactions',
                views: {
                    'main@': {
                        controller: 'transactionsController as model',
                        templateUrl: 'src/app/plugins/CourseCheckout/transactions.tpl.html'
                    }

                },
                data: {},
                resolve: {
                    pageType: function() {
                        return "page";
                    },
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.CourseCheckout']) && $ocLazyLoad.getModules().indexOf('ace.CourseCheckout') === -1) {
                                    requiredPlugins.push(data['ace.CourseCheckout']);
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

                    }]
                }
            });
    }]);

    // The name of the module, followed by its dependencies (at the bottom to facilitate enclosure)
}(angular.module("ace.home", [
    'ui.router',
    'angulartics',
    'angulartics.google.analytics',
    'angulartics.facebook.pixel'
])));
