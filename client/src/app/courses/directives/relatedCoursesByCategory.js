(function(module) {
    module.directive('relatedCoursesByCategory', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'E',
            templateUrl: 'courses/directives/relatedCoursesByCategory.tpl.html',
            link: linker,
            controller: 'relatedCoursesByCategory as model',
            bindToController: true,
            scope: {
                categoryId: '@',
                courseId: '@',
                limit: '@'
            }
        };
    });

    module.controller('relatedCoursesByCategory', ['Course', 'ViewCourse', 'CategoriesRelatedCourse', '$state', '$scope', '$rootScope', function(Course, ViewCourse, CategoriesRelatedCourse, $state, $scope, $rootScope) {
        var model = this;
        if (angular.isDefined(model.limit)) {
            limit = model.limit;
        }
        model.relatedCoursesByCategory = [];
        courseId = model.courseId;
        var category_id = model.categoryId;
        var category_arr = {
            id: category_id,
            course_id: courseId,
            limit: limit,
            sort_by: "DESC",
            field: "id,title,slug,price,image_hash,is_from_mooc_affiliate,course_image,average_rating"
        };
        CategoriesRelatedCourse.get(category_arr).$promise.then(function(response) {
            model.loading = false;
            model.related_courses_by_category_length = response.data.length;
            model.relatedCoursesByCategory = response;
        });

    }]);
})(angular.module('ace.courses'));
