(function(module) {
    module.factory('Course', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/courses.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);
    module.factory('ViewCourse', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/courses/:id.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);
    module.factory('Teaching', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/users/:id/courses.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);
    module.factory('CourseCategory', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/categories/:id/courses.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);
    module.factory('UserTeachingCourse', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/users/:id/courses/:course_id/related.json', {
                id: '@id',
                course_id: '@course_id'
            }
        );
    }]);
    module.factory('CategoriesRelatedCourse', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/categories/:id/courses/:course_id/related.json', {
                id: '@id'
            }
        );
    }]);
    module.factory('OnlineCourseLessons', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/courses/:id/online_course_lessons.json', {
                id: '@id'
            }
        );
    }]);
    module.factory('OnlineCourseLessonsDelete', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/online_course_lessons/:id.json', {
                id: '@id'
            }, {
                'DeleteOnlineLesson': {
                    method: 'Delete'
                }
            }, {
                'update': {
                    method: 'PUT'
                }
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
    module.factory('OnlineCourseLessonsNeighbour', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/online_course_lessons/:id/neighbours.json', {
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
    module.factory('Learning', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/users/:id/course_users.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);
    module.factory('Wishlist', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/users/:id/course_favourites.json', {
                id: '@id'
            }
        );
    }]);
    module.factory('AddFavourite', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/course_favourites.json', {
                course_id: '@course_id'
            }, {
                addfav: {
                    method: 'POST'
                }
            }
        );
    }]);
    module.factory('DeleteFavourite', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/course_favourites/:id.json', {
                id: '@id'
            }, {
                'delfav': {
                    method: 'Delete'
                }
            }
        );
    }]);
    module.factory('DeleteFavouriteByCourseId', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/courses/:id/course_favourites.json', {
                id: '@id'
            }, {
                'deleteFavByCourseId': {
                    method: 'Delete'
                }
            }
        );
    }]);
    module.factory('CourseUpdate', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/courses/:id.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);
    module.factory('CourseUsersFeedback', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/courses/:id/course_user_feedbacks.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);

    module.factory('CourseUserDetails', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/course_users/:id.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);
    module.factory('TakeCourse', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/course_users.json', {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);
    module.factory('InstructionLevels', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/instructional_levels.json'
        );
    }]);

    module.factory('GetLanguages', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/languages.json'
        );
    }]);
    module.factory('CourseUsers', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/courses/:id/course_users.json'
        );
    }]);
    module.factory('PayoutList', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/payouts.json'
        );
    }]);
    module.factory('PayoutRedirect', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/payouts_connect.json', {
                id: '@id'
            }, {
                'getRedirectUri': {
                    method: 'POST'
                }
            }
        );
    }]);
    module.factory('getGateways', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/get_gateways.json'
        );
    }]);
    module.factory('payNow', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/order/:id.json', {
                id: '@id'
            }, {
                paynowpost: {
                    method: 'POST'
                }
            }
        );
    }]);
    module.factory('Countries', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/countries.json'
        );
    }]);
    module.factory('Categories', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/categories/:id.json'
        );
    }]);
    module.factory('Archive', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/course_users/:id/archive.json', {
                id: '@id'
            }
        );
    }]);
    module.factory('UpdateDispalyOrder', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/online_course_lessons/courses/:id/update_display_order.json', {
                id: '@id'
            }, {
                update: {
                    method: 'PUT'
                }
            }
        );
    }]);
    module.factory('OnlineLessonViewPost', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/online_course_lesson_views.json', {
                id: '@id'
            }, {
                lessonViewPost: {
                    method: 'POST'
                }
            }
        );
    }]);
    module.factory('OnlineLessonViewComplete', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/online_course_lesson_views/:id.json', {
                id: '@id'
            }, {
                lessonViewComplete: {
                    method: 'PUT'
                }
            }
        );
    }]);
    module.factory('CategoriesList', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/categories.json', {
                id: '@id'
            }
        );
    }]);
    module.factory('GetCourseUserEntry', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/courses/:course_id/users/:user_id/course_users.json', {
                course_id: '@course_id',
                user_id: '@user_id'
            }
        );
    }]);
    module.factory('UserSubscription', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/user_subscriptions.json', {

            }
        );
    }]);
    module.factory('InstructionLevelSubscription', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/instructional_levels_subscriptions.json', {
                subscription_id: '@subscription_id'
            }
        );
    }]);
})(angular.module("ace.courses"));
