(function(module) {
    module.directive('homeCourse', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'E',
            templateUrl: 'courses/directives/homeCourse.tpl.html',
            link: linker,
            controller: 'homeCourseController as model',
            bindToController: true,
            scope: {
                course: '=homeCourse',
                lookups: '=courseLookups',
                filter: '@filter',
                limit: '@limit'
            }
        };
    });

    module.controller('homeCourseController', ['Course', 'Common', '$scope', '$rootScope', 'AddFavourite', function(Course, Common, $scope, $rootScope, AddFavourite) {
        var model = this;
        filter = model.filter;
        limit = model.limit;
        params = {};
        model.common = [];
        if (filter === 'most_popular') {
            params.sort = 'course_user_count';
            params.sort_by = 'DESC';
            params.limit = limit;
            params.field = 'id,title,slug,user_id,displayname,price,user_image_hash,image_hash,is_from_mooc_affiliate,course_image,course_user_count';
        }
        if (filter === 'learner_recommended') {
            params.sort = 'total_rating';
            params.sort_by = 'DESC';
            params.limit = limit;
            params.field = 'id,title,slug,image_hash,is_from_mooc_affiliate,course_image,user_id,displayname';
        }
        if (filter === 'featured') {
            params.sort = 'is_featured';
            params.sort_by = 'DESC';
            params.limit = limit;
            params.field = 'id,title,slug,image_hash,is_from_mooc_affiliate,course_image,user_id,displayname,course_user_count,price';
        }
        if (filter === 'new') {
            params.sort = 'id';
            params.sort_by = 'DESC';
            params.limit = limit;
            params.field = 'id,title,slug,user_id,displayname,image_hash,is_from_mooc_affiliate,course_image';
        }
        model.homeCourse = [];
        Course.get(params).$promise.then(function(response) {
            model.loading = false;
            model.homeCourse = response;
        });
        $scope.addToFavourite = function(courseID, event) {
            event.preventDefault();
            courseArr = {
                course_id: courseID
            };
            AddFavourite.addfav(courseArr, function(response) {
                $(event.target).parent().addClass('text-danger');
            });
        };

        filter_parent = "parent";
        Common.get({
            category_type: filter_parent,
            limit: "all",
            filter: "active",
            field: "id,sub_category_name"
        }).$promise.then(function(response) {
            model.common.parentCategories = response;
        });

    }]);
})(angular.module('ace.courses'));
