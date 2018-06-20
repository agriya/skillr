(function(module) {
    module.config(['$stateProvider', '$analyticsProvider', function($stateProvider, $analyticsProvider) {
        var getToken = {
            'TokenServiceData': function(TokenService) {
                return TokenService.promiseSettings;
            }
        };
        $stateProvider
            .state('courses', {
                url: '/courses',
                views: {
                    'main@': {
                        controller: 'CoursesController as model',
                        templateUrl: 'courses/courses.tpl.html'
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
                                if (angular.isDefined(data['ace.courseWishlist']) && $ocLazyLoad.getModules().indexOf('ace.courseWishlist') === -1) {
                                    requiredPlugins.push(data['ace.courseWishlist']);
                                }
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
            .state('addCourse', {
                url: '/courses/add',
                views: {
                    'main@': {
                        controller: 'AddCourseController as model',
                        templateUrl: 'courses/addCourse.tpl.html'
                    }
                },
                data: {

                },
                resolve: getToken
            })
            .state('viewCourse', {
                url: '/course/{id}/{slug}',
                views: {
                    'main@': {
                        controller: 'ViewCourseController as model',
                        templateUrl: 'courses/viewCourse.tpl.html'
                    }
                },
                data: {
                    activetab: 'viewCourse'
                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.socialShare']) && $ocLazyLoad.getModules().indexOf('ace.socialShare') === -1) {
                                    requiredPlugins.push(data['ace.socialShare']);
                                }
                                if (angular.isDefined(data['ace.courseWishlist']) && $ocLazyLoad.getModules().indexOf('ace.courseWishlist') === -1) {
                                    requiredPlugins.push(data['ace.courseWishlist']);
                                }
                                if (angular.isDefined(data['ace.ratingAndReview']) && $ocLazyLoad.getModules().indexOf('ace.ratingAndReview') === -1) {
                                    requiredPlugins.push(data['ace.ratingAndReview']);
                                }
                                if (angular.isDefined(data['ace.CourseCheckout']) && $ocLazyLoad.getModules().indexOf('ace.CourseCheckout') === -1) {
                                    requiredPlugins.push(data['ace.CourseCheckout']);
                                }
                                if (angular.isDefined(data['ace.userprofile']) && $ocLazyLoad.getModules().indexOf('ace.userprofile') === -1) {
                                    requiredPlugins.push(data['ace.userprofile']);
                                }
                                if (angular.isDefined(data['ace.subscriptions']) && $ocLazyLoad.getModules().indexOf('ace.subscriptions') === -1) {
                                    requiredPlugins.push(data['ace.subscriptions']);
                                }
                                if (angular.isDefined(data['ace.comments']) && $ocLazyLoad.getModules().indexOf('ace.comments') === -1) {
                                    requiredPlugins.push(data['ace.comments']);
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
            .state('browseCourse', {
                url: '/courses/category/{id}/{slug}',
                views: {
                    'main@': {
                        controller: 'CoursesController as model',
                        templateUrl: 'courses/courses.tpl.html'
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
                                if (angular.isDefined(data['ace.courseWishlist']) && $ocLazyLoad.getModules().indexOf('ace.courseWishlist') === -1) {
                                    requiredPlugins.push(data['ace.courseWishlist']);
                                }
                                if (angular.isDefined(data['ace.ratingAndReview']) && $ocLazyLoad.getModules().indexOf('ace.ratingAndReview') === -1) {
                                    requiredPlugins.push(data['ace.ratingAndReview']);
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
            })
            .state('CourseSearch', {
                url: '/courses/search?category_id&q&price&instructionLevel&language&sort',
                reloadOnSearch: false,
                views: {
                    'main@': {
                        controller: 'searchController as model',
                        templateUrl: 'courses/search.tpl.html'
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
            .state('LearnCourse', {
                url: '/{slug}/learn/{id}?lesson',
                reloadOnSearch: false,
                views: {
                    'main@': {
                        controller: 'learnCourseController as model',
                        templateUrl: 'courses/learnCourse.tpl.html'
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
                                if (angular.isDefined(data['ace.paymentandcart']) && $ocLazyLoad.getModules().indexOf('ace.paymentandcart') === -1) {
                                    requiredPlugins.push(data['ace.paymentandcart']);
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
            .state('myCoursesLearning', {
                url: '/my-courses/learning?ordering',
                views: {
                    'main@': {
                        controller: 'learningController as model',
                        templateUrl: 'courses/learning.tpl.html'
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
                                if (angular.isDefined(data['ace.ratingAndReview']) && $ocLazyLoad.getModules().indexOf('ace.ratingAndReview') === -1) {
                                    requiredPlugins.push(data['ace.ratingAndReview']);
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
            })
            .state('myCoursesTeaching', {
                url: '/my-courses/teaching?ordering',
                views: {
                    'main@': {
                        controller: 'teachingController as model',
                        templateUrl: 'courses/teaching.tpl.html'
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
                                if (angular.isDefined(data['ace.instructor']) && $ocLazyLoad.getModules().indexOf('ace.instructor') === -1) {
                                    requiredPlugins.push(data['ace.instructor']);
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
            .state('myCoursesWishlist', {
                url: '/my-courses/wishlist',
                views: {
                    'main@': {
                        controller: 'wishlistController as model',
                        templateUrl: 'courses/wishlist.tpl.html'
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
                                if (angular.isDefined(data['ace.ratingAndReview']) && $ocLazyLoad.getModules().indexOf('ace.ratingAndReview') === -1) {
                                    requiredPlugins.push(data['ace.ratingAndReview']);
                                }
                                if (angular.isDefined(data['ace.userprofile']) && $ocLazyLoad.getModules().indexOf('ace.userprofile') === -1) {
                                    requiredPlugins.push(data['ace.userprofile']);
                                }
                                if (angular.isDefined(data['ace.courseWishlist']) && $ocLazyLoad.getModules().indexOf('ace.courseWishlist') === -1) {
                                    requiredPlugins.push(data['ace.courseWishlist']);
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
            .state('manageCourse', {
                url: '/manage-course/add/{id}/{slug}',
                views: {
                    'main@': {
                        controller: 'manageCourseController as model',
                        templateUrl: 'courses/manageCourse.tpl.html'
                    }

                },
                data: {
                    activetab: 'course_roadmap'
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
                    }]
                }
            })
            .state('manageCourseRoadmap', {
                url: '/manage-course/edit-getting-started/{id}',
                views: {
                    'main@': {
                        controller: 'manageCourseController as model',
                        templateUrl: 'courses/manageCourse.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_roadmap'
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
                    }]
                }
            })
            .state('manageCourseFeedback', {
                url: '/manage-course/edit-status/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCourseFeedbackController as model',
                        templateUrl: 'courses/manageCourseFeedback.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_feedback'
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
                    }]
                }
            })
            .state('manageCourseGoals', {
                url: '/manage-course/edit-goals-and-audience/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCourseGoalsController as model',
                        templateUrl: 'courses/manageCourseGoals.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_goals'
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
                    }]
                }
            })
            .state('manageCourseCurriculum', {
                url: '/manage-course/edit-curriculum/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCourseCurriculumController as model',
                        templateUrl: 'courses/manageCourseCurriculum.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_curriculum'
                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.articlelesson']) && $ocLazyLoad.getModules().indexOf('ace.articlelesson') === -1) {
                                    requiredPlugins.push(data['ace.articlelesson']);
                                }
                                if (angular.isDefined(data['ace.videolesson']) && $ocLazyLoad.getModules().indexOf('ace.videolesson') === -1) {
                                    requiredPlugins.push(data['ace.videolesson']);
                                }
                                if (angular.isDefined(data['ace.downloadblefilelesson']) && $ocLazyLoad.getModules().indexOf('ace.downloadblefilelesson') === -1) {
                                    requiredPlugins.push(data['ace.downloadblefilelesson']);
                                }
                                if (angular.isDefined(data['ace.videoembedorexternallesson']) && $ocLazyLoad.getModules().indexOf('ace.videoembedorexternallesson') === -1) {
                                    requiredPlugins.push(data['ace.videoembedorexternallesson']);
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
            .state('manageCourseBasics', {
                url: '/manage-course/edit-basics/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCourseBasicsController as model',
                        templateUrl: 'courses/manageCourseBasics.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_basics'
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
                    }]
                }
            })
            .state('manageCourseSummary', {
                url: '/manage-course/edit-details/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCourseSummaryController as model',
                        templateUrl: 'courses/manageCourseSummary.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_summary'
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
                    }]
                }
            })
            .state('manageCourseImage', {
                url: '/manage-course/edit-image/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCourseImageController as model',
                        templateUrl: 'courses/manageCourseImage.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_image'
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
                    }]
                }
            })
            .state('manageCoursePromoVideo', {
                url: '/manage-course/edit-promo-video/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCoursePromoVideoController as model',
                        templateUrl: 'courses/manageCoursePromoVideo.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_promo_video'
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
                    }]
                }
            })
            .state('manageCoursePrice', {
                url: '/manage-course/edit-price-and-promotions/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCoursePriceController as model',
                        templateUrl: 'courses/manageCoursePrice.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_price'
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
                    }]
                }
            })
            .state('manageCourseDangerZone', {
                url: '/manage-course/edit-danger-zone/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCourseDangerZoneController as model',
                        templateUrl: 'courses/manageCourseDangeZone.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_danger_zone'
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
                    }]
                }
            })

        .state('manageCourseHelp', {
            url: '/manage-course/edit-help/{id}',
            views: {
                'main@': {
                    controller: 'ManageCourseHelpController as model',
                    templateUrl: 'courses/manageCourseHelp.tpl.html'
                }
            },
            data: {
                activetab: 'course_help'
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
                }]
            }
        });
    }]);
}(angular.module('ace.courses', [
    'ui.router',
    'ngResource',
    'ace.common',
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
            }
        };
        $stateProvider
            .state('courses', {
                url: '/courses',
                views: {
                    'main@': {
                        controller: 'CoursesController as model',
                        templateUrl: 'courses/courses.tpl.html'
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
                                if (angular.isDefined(data['ace.courseWishlist']) && $ocLazyLoad.getModules().indexOf('ace.courseWishlist') === -1) {
                                    requiredPlugins.push(data['ace.courseWishlist']);
                                }
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
            .state('addCourse', {
                url: '/courses/add',
                views: {
                    'main@': {
                        controller: 'AddCourseController as model',
                        templateUrl: 'courses/addCourse.tpl.html'
                    }
                },
                data: {

                },
                resolve: getToken
            })
            .state('viewCourse', {
                url: '/course/{id}/{slug}',
                views: {
                    'main@': {
                        controller: 'ViewCourseController as model',
                        templateUrl: 'courses/viewCourse.tpl.html'
                    }
                },
                data: {
                    activetab: 'viewCourse'
                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.socialShare']) && $ocLazyLoad.getModules().indexOf('ace.socialShare') === -1) {
                                    requiredPlugins.push(data['ace.socialShare']);
                                }
                                if (angular.isDefined(data['ace.courseWishlist']) && $ocLazyLoad.getModules().indexOf('ace.courseWishlist') === -1) {
                                    requiredPlugins.push(data['ace.courseWishlist']);
                                }
                                if (angular.isDefined(data['ace.ratingAndReview']) && $ocLazyLoad.getModules().indexOf('ace.ratingAndReview') === -1) {
                                    requiredPlugins.push(data['ace.ratingAndReview']);
                                }
                                if (angular.isDefined(data['ace.CourseCheckout']) && $ocLazyLoad.getModules().indexOf('ace.CourseCheckout') === -1) {
                                    requiredPlugins.push(data['ace.CourseCheckout']);
                                }
                                if (angular.isDefined(data['ace.userprofile']) && $ocLazyLoad.getModules().indexOf('ace.userprofile') === -1) {
                                    requiredPlugins.push(data['ace.userprofile']);
                                }
                                if (angular.isDefined(data['ace.subscriptions']) && $ocLazyLoad.getModules().indexOf('ace.subscriptions') === -1) {
                                    requiredPlugins.push(data['ace.subscriptions']);
                                }
                                if (angular.isDefined(data['ace.comments']) && $ocLazyLoad.getModules().indexOf('ace.comments') === -1) {
                                    requiredPlugins.push(data['ace.comments']);
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
            .state('browseCourse', {
                url: '/courses/category/{id}/{slug}',
                views: {
                    'main@': {
                        controller: 'CoursesController as model',
                        templateUrl: 'courses/courses.tpl.html'
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
                                if (angular.isDefined(data['ace.courseWishlist']) && $ocLazyLoad.getModules().indexOf('ace.courseWishlist') === -1) {
                                    requiredPlugins.push(data['ace.courseWishlist']);
                                }
                                if (angular.isDefined(data['ace.ratingAndReview']) && $ocLazyLoad.getModules().indexOf('ace.ratingAndReview') === -1) {
                                    requiredPlugins.push(data['ace.ratingAndReview']);
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
            })
            .state('CourseSearch', {
                url: '/courses/search?category_id&q&price&instructionLevel&language&sort',
                reloadOnSearch: false,
                views: {
                    'main@': {
                        controller: 'searchController as model',
                        templateUrl: 'courses/search.tpl.html'
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
            .state('LearnCourse', {
                url: '/{slug}/learn/{id}?lesson',
                reloadOnSearch: false,
                views: {
                    'main@': {
                        controller: 'learnCourseController as model',
                        templateUrl: 'courses/learnCourse.tpl.html'
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
                                if (angular.isDefined(data['ace.paymentandcart']) && $ocLazyLoad.getModules().indexOf('ace.paymentandcart') === -1) {
                                    requiredPlugins.push(data['ace.paymentandcart']);
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
            .state('myCoursesLearning', {
                url: '/my-courses/learning?ordering',
                views: {
                    'main@': {
                        controller: 'learningController as model',
                        templateUrl: 'courses/learning.tpl.html'
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
                                if (angular.isDefined(data['ace.ratingAndReview']) && $ocLazyLoad.getModules().indexOf('ace.ratingAndReview') === -1) {
                                    requiredPlugins.push(data['ace.ratingAndReview']);
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
            })
            .state('myCoursesTeaching', {
                url: '/my-courses/teaching?ordering',
                views: {
                    'main@': {
                        controller: 'teachingController as model',
                        templateUrl: 'courses/teaching.tpl.html'
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
                                if (angular.isDefined(data['ace.instructor']) && $ocLazyLoad.getModules().indexOf('ace.instructor') === -1) {
                                    requiredPlugins.push(data['ace.instructor']);
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
            .state('myCoursesWishlist', {
                url: '/my-courses/wishlist',
                views: {
                    'main@': {
                        controller: 'wishlistController as model',
                        templateUrl: 'courses/wishlist.tpl.html'
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
                                if (angular.isDefined(data['ace.ratingAndReview']) && $ocLazyLoad.getModules().indexOf('ace.ratingAndReview') === -1) {
                                    requiredPlugins.push(data['ace.ratingAndReview']);
                                }
                                if (angular.isDefined(data['ace.userprofile']) && $ocLazyLoad.getModules().indexOf('ace.userprofile') === -1) {
                                    requiredPlugins.push(data['ace.userprofile']);
                                }
                                if (angular.isDefined(data['ace.courseWishlist']) && $ocLazyLoad.getModules().indexOf('ace.courseWishlist') === -1) {
                                    requiredPlugins.push(data['ace.courseWishlist']);
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
            .state('manageCourse', {
                url: '/manage-course/add/{id}/{slug}',
                views: {
                    'main@': {
                        controller: 'manageCourseController as model',
                        templateUrl: 'courses/manageCourse.tpl.html'
                    }

                },
                data: {
                    activetab: 'course_roadmap'
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
                    }]
                }
            })
            .state('manageCourseRoadmap', {
                url: '/manage-course/edit-getting-started/{id}',
                views: {
                    'main@': {
                        controller: 'manageCourseController as model',
                        templateUrl: 'courses/manageCourse.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_roadmap'
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
                    }]
                }
            })
            .state('manageCourseFeedback', {
                url: '/manage-course/edit-status/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCourseFeedbackController as model',
                        templateUrl: 'courses/manageCourseFeedback.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_feedback'
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
                    }]
                }
            })
            .state('manageCourseGoals', {
                url: '/manage-course/edit-goals-and-audience/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCourseGoalsController as model',
                        templateUrl: 'courses/manageCourseGoals.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_goals'
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
                    }]
                }
            })
            .state('manageCourseCurriculum', {
                url: '/manage-course/edit-curriculum/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCourseCurriculumController as model',
                        templateUrl: 'courses/manageCourseCurriculum.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_curriculum'
                },
                resolve: {
                    TokenServiceData: ['$ocLazyLoad', 'TokenService', '$rootScope', '$q', function($ocLazyLoad, TokenService, $rootScope, $q) {
                        var promise = TokenService.promise;
                        var promiseSettings = TokenService.promiseSettings;
                        return $q.all({
                            TokenServiceData: TokenService.promise,
                            load: promiseSettings.then(function(data) {
                                var requiredPlugins = [];
                                if (angular.isDefined(data['ace.articlelesson']) && $ocLazyLoad.getModules().indexOf('ace.articlelesson') === -1) {
                                    requiredPlugins.push(data['ace.articlelesson']);
                                }
                                if (angular.isDefined(data['ace.videolesson']) && $ocLazyLoad.getModules().indexOf('ace.videolesson') === -1) {
                                    requiredPlugins.push(data['ace.videolesson']);
                                }
                                if (angular.isDefined(data['ace.downloadblefilelesson']) && $ocLazyLoad.getModules().indexOf('ace.downloadblefilelesson') === -1) {
                                    requiredPlugins.push(data['ace.downloadblefilelesson']);
                                }
                                if (angular.isDefined(data['ace.videoembedorexternallesson']) && $ocLazyLoad.getModules().indexOf('ace.videoembedorexternallesson') === -1) {
                                    requiredPlugins.push(data['ace.videoembedorexternallesson']);
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
            .state('manageCourseBasics', {
                url: '/manage-course/edit-basics/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCourseBasicsController as model',
                        templateUrl: 'courses/manageCourseBasics.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_basics'
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
                    }]
                }
            })
            .state('manageCourseSummary', {
                url: '/manage-course/edit-details/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCourseSummaryController as model',
                        templateUrl: 'courses/manageCourseSummary.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_summary'
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
                    }]
                }
            })
            .state('manageCourseImage', {
                url: '/manage-course/edit-image/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCourseImageController as model',
                        templateUrl: 'courses/manageCourseImage.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_image'
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
                    }]
                }
            })
            .state('manageCoursePromoVideo', {
                url: '/manage-course/edit-promo-video/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCoursePromoVideoController as model',
                        templateUrl: 'courses/manageCoursePromoVideo.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_promo_video'
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
                    }]
                }
            })
            .state('manageCoursePrice', {
                url: '/manage-course/edit-price-and-promotions/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCoursePriceController as model',
                        templateUrl: 'courses/manageCoursePrice.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_price'
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
                    }]
                }
            })
            .state('manageCourseDangerZone', {
                url: '/manage-course/edit-danger-zone/{id}',
                views: {
                    'main@': {
                        controller: 'ManageCourseDangerZoneController as model',
                        templateUrl: 'courses/manageCourseDangeZone.tpl.html'
                    }
                },
                data: {
                    activetab: 'course_danger_zone'
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
                    }]
                }
            })

        .state('manageCourseHelp', {
            url: '/manage-course/edit-help/{id}',
            views: {
                'main@': {
                    controller: 'ManageCourseHelpController as model',
                    templateUrl: 'courses/manageCourseHelp.tpl.html'
                }
            },
            data: {
                activetab: 'course_help'
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
                }]
            }
        });
    }]);
}(angular.module('ace.courses', [
    'ui.router',
    'ngResource',
    'ace.common',
    'OcLazyLoad',
    'angulartics',
    'angulartics.google.analytics',
    'angulartics.facebook.pixel',
    'ace.home'
])));
