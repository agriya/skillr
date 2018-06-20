(function(module) {
    module.directive('courseCategory', function() {
        var linker = function(scope, element, attrs, controller) {};
        return {
            restrict: 'E',
            templateUrl: 'courses/directives/courseCategory.tpl.html',
            link: linker,
            controller: 'courseCategoryController as model',
            bindToController: true,
            scope: {
                categoryId: '@',
                limit: '@',
                categoryViewType: '@'
            }
        };
    });

    module.controller('courseCategoryController', ['Course', 'Categories', 'AddFavourite', '$scope', 'DeleteFavouriteByCourseId', '$rootScope', '$state', '$modal', function(Course, Categories, AddFavourite, $scope, DeleteFavouriteByCourseId, $rootScope, $state, $modal) {
        var model = this;
        model.courses = [];
        model.categories = [];
        $scope.category = '';
        category_id = model.categoryId;
        $scope.category_limit = model.limit;
        $scope.category_view_type = model.categoryViewType;
        $rootScope.activeMenu = 'library';
        $scope.category = $state.params.id;
        $scope.isAuth = $rootScope.isAuth;

        params = {};

        function getCourses(element) {
            params.page = $scope.currentPage;
            params.limit = 12;
            params.field = 'id,title,slug,subtitle,price,image_hash,is_from_mooc_affiliate,course_image,displayname,course_user_count';
            if (category_id) {
                params.category_id = category_id;
                Categories.get({
                    id: category_id,
                    field: 'category_id,sub_category_name,description,sub_category'
                }).$promise.then(function(response) {
                    model.categories = response.data[0];
                });
            }
            Course.get({
                filter: params
            }).$promise.then(function(response) {
                model.loading = false;
                model.courses = response;
                $scope._metadata = response._metadata;
                if (element !== null && angular.isDefined(element)) {
                    $('html, body').animate({
                        scrollTop: $(element).offset().top
                    }, 2000, 'swing', false);
                }
            });
        }

        $scope.index = function(element) {
            $scope.currentPage = ($scope.currentPage !== undefined) ? parseInt($scope.currentPage) : 1;
            getCourses(element);
        };
        $scope.index(null);
        $scope.paginate = function(element) {
            $scope.currentPage = parseInt($scope.currentPage);
            $scope.index(element);
        };
    }]);

    module.directive('showtab',
        function() {
            return {
                link: function(scope, element, attrs) {
                    element.click(function(e) {
                        e.preventDefault();
                        $(element).tab('show');
                    });
                }
            };
        });

    module.directive('creditCard', function() {
        return {
            // Restrict it to be an attribute in this case
            restrict: 'A',
            link: function(scope, element, attrs) {
                $('.SudopayCreditCardNumber').payment('formatCardNumber');
            }
        };
    });
})(angular.module('ace.courses'));
