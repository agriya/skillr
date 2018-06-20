(function(module) {

    module.controller('wishlistController', ['$state', 'Course', '$scope', 'Wishlist', '$rootScope', 'DeleteFavourite', '$filter', 'TokenServiceData', function($state, Course, $scope, Wishlist, $rootScope, DeleteFavourite, $filter, TokenServiceData) {
        var model = this;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("My Wishlist Courses");
        model.wishlistCourses = [];
        model.deleFavourites = deleFavourites;
        $rootScope.activeMenu = 'dashboard';

        function getWishlistCourses(element) {
            userID = $rootScope.auth.id;
            params = {};
            params.page = $scope.currentPage;
            getUserParams = {
                id: userID,
                filter: params,
                limit: 12,
                field: 'id,course_title,course_slug,price,subtitle,image_hash,is_from_mooc_affiliate,course_id,course_image,teacher_name,teacher_user_id,average_rating,parent_category_name,parent_category_id,category_name,category_id,instructional_level_name,instructional_level_id'
            };
            Wishlist.get(getUserParams).$promise.then(function(response) {
                model.wishlistCourses = response;
                $scope._metadata = response._metadata;
                model.loading = false;
                if (element !== null && angular.isDefined(element)) {
                    $('html, body').animate({
                        scrollTop: $(element).offset().top
                    }, 2000, 'swing', false);
                }
            });
        }

        function deleFavourites(courseID, e) {
            e.preventDefault();
            courseArr = {
                id: courseID
            };
            DeleteFavourite.delfav(courseArr, function(response) {
                var delElement = angular.element(document.querySelector('#Wishlist_elements_' + courseID));
                delElement.remove();
                // to hide pagination when wishlisted course length is 0
                wishlisted_course = angular.element(document.getElementsByClassName('course-listing'));
                wishlisted_course_length = wishlisted_course.children().length;
                if (angular.isDefined(wishlisted_course_length) && wishlisted_course_length <= 0) {
                    angular.element(document.getElementsByClassName('paging')).addClass("ng-hide");
                }
            });
        }
        $scope.index = function(element) {
            $scope.currentPage = ($scope.currentPage !== undefined) ? parseInt($scope.currentPage) : 1;
            getWishlistCourses(element);
        };
        $scope.index(null);
        $scope.paginate = function(element) {
            $scope.currentPage = parseInt($scope.currentPage);
            $scope.index(element);
        };
        $scope.goToState = function(state, params) {
            $state.go(state, params);
        };
    }]);

}(angular.module("ace.courses")));
