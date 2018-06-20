/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {

}(angular.module('ace.courseWishlist', [
    'ngResource'
])));

(function(module) {
    module.directive('courseWishlistData', function() {
        var linker = function(scope, element, attrs) {};
        return {
            restrict: 'E',
            templateUrl: 'src/app/plugins/CourseWishlist/CourseWishlistByUser.tpl.html',
            link: linker,
            controller: 'CourseWishlistDataController as model',
            bindToController: true,
            scope: {
                userId: '@userId'
            }
        };
    });

    module.controller('CourseWishlistDataController', ['$state', '$scope', '$rootScope', 'UserWishlist', function($state, $scope, $rootScope, UserWishlist) {
        var model = this;
        params = {};
        userID = model.userId;
        getUserParams = {
            id: userID,
            filter: params,
            limit: 12,
            field: 'course_id,price,image_hash,course_title,course_slug,is_from_mooc_affiliate,course_image,teacher_user_id,teacher_name,average_rating'
        };

        function getWishlistedCourses() {
            params.page = $scope.currentPage;
            UserWishlist.get(getUserParams).$promise.then(function(response) {
                model.wishlistCourses = response;
                $scope._metadata = response._metadata;
                model.loading = false;
            });
        }
        $scope.index = function() {
            $scope.currentPage = ($scope.currentPage !== undefined) ? parseInt($scope.currentPage) : 1;
            getWishlistedCourses();
        };
        $scope.index();
        $scope.paginate = function(pageno) {
            $scope.currentPage = parseInt($scope.currentPage);
            $scope.index();
        };
    }]);
})(angular.module('ace.courseWishlist'));

(function(module) {
    module.directive('courseWishlist', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'E',
            templateUrl: 'src/app/plugins/CourseWishlist/courseWishlist.tpl.html',
            link: linker,
            controller: 'WishlistController as model',
            bindToController: true,
            scope: {
                courseWishlist: '=courseWishlist',
                wishlistType: '@wishlistType',
                wishlistLabel: '@wishlistLabel',
                wishlistedLabel: '@wishlistedLabel',
            }
        };
    });

    module.controller('WishlistController', ['$scope', '$state', '$rootScope', 'AddFavourite', 'DeleteFavouriteByCourseId', '$modal', function($scope, $state, $rootScope, AddFavourite, DeleteFavouriteByCourseId, $modal) {
        var model = this;
        //model.courseWishlist having wishlist data
        $scope.toggleFav = function(courseID, event, context) {
            event.preventDefault();
            if (!$.cookie('refresh_token')) {
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
            } else {
                userID = parseInt($rootScope.auth.id);
                if (context.is_favourite === false) {
                    params = {
                        course_id: courseID,
                        user_id: userID
                    };
                    AddFavourite.addfav(params, function(response) {
                        $(event.target).find('span').addClass('text-danger');
                        model.courseWishlist.is_favourite = true;
                    });

                } else if (context.is_favourite === true) {
                    params = {
                        id: courseID
                    };
                    DeleteFavouriteByCourseId.deleteFavByCourseId(params, function(response) {
                        model.courseWishlist.is_favourite = false;
                    });

                }
            }
        };

    }]);
})(angular.module('ace.courseWishlist'));

(function(module) {
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
    module.factory('UserWishlist', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/users/:id/course_favourites.json', {
                id: '@id'
            }
        );
    }]);
})(angular.module("ace.courseWishlist"));
