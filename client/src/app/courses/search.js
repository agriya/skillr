(function(module) {

    module.controller('searchController', ['$state', 'Course', '$scope', 'Common', 'InstructionLevels', 'GetLanguages', '$location', '$rootScope', '$filter', 'TokenServiceData', function($state, Course, $scope, Common, InstructionLevels, GetLanguages, $location, $rootScope, $filter, TokenServiceData) {
        var model = this;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Search");
        model.courses = [];
        model.searchCat = [];
        model.common = [];
        model.common.location = $location.path();
        $scope.hsearchVal = '';
        filter_parent = "parent";
        //initial setup params		
        $scope.searchingCourseCategory = $state.params.category_id ? parseInt($state.params.category_id) : '';
        $scope.searchingCoursePrice = $state.params.price ? $state.params.price : '';
        $scope.searchingCourseLanguage = $state.params.language ? parseInt($state.params.language) : '';
        $scope.searchingInstructionLevel = $state.params.instructionLevel ? parseInt($state.params.instructionLevel) : '';
        $scope.searchingText = $state.params.q ? decodeURIComponent($state.params.q) : '';
        $rootScope.activeMenu = 'library';
        $scope.sortValue = $state.params.sort ? $state.params.sort : '';
        model.loading = true;
        $scope.noFiltersUsed = false;
        //change params on location reload false
        $scope.$on('$locationChangeSuccess', function() {
            model.loading = true;
            $scope.searchingCourseCategory = $state.params.category_id ? parseInt($state.params.category_id) : '';
            $scope.searchingCoursePrice = $state.params.price ? $state.params.price : '';
            $scope.searchingCourseLanguage = $state.params.language ? parseInt($state.params.language) : '';
            $scope.searchingInstructionLevel = $state.params.instructionLevel ? parseInt($state.params.instructionLevel) : '';
            $scope.searchingText = $state.params.q ? decodeURIComponent($state.params.q) : '';
            $rootScope.activeMenu = 'library';
            $scope.sortValue = $state.params.sort ? $state.params.sort : '';
            $scope.q = $state.params.q ? $state.params.q : '';
            $scope.index(null);
        });
        Common.get({
            category_type: filter_parent,
            limit: "all",
            field: "id,sub_category_name"
        }).$promise.then(function(response) {
            model.common.parentCategories = response;
        });

        InstructionLevels.get({
                limit: 'all',
                field: 'name,id'
            }).$promise
            .then(function(response) {
                model.InstructionLevels = response.data;
            });

        GetLanguages.get({
            limit: 'all',
            field: 'name,id'
        }).$promise.then(function(response) {
            model.languages = response.data;
        });

        function getCourses(element) {
            $scope.currentPage = ($scope.currentPage !== undefined) ? parseInt($scope.currentPage) : 1;
            $scope.filter = ($scope.filter !== undefined) ? $scope.filter : (($state.params.filter !== undefined) ? $state.params.filter : "");
            $scope.q = ($scope.q !== undefined) ? $scope.q : (($state.params.q !== undefined) ? $state.params.q : "");
            var params = {};
            params.page = $scope.currentPage;
            params.q = $scope.q;
            val = $state.params.q ? decodeURIComponent($state.params.q) : '';
            $scope.hsearchVal = val;
            if ($state.params.sort) {
                if ($state.params.sort === 'reviews') {
                    params.sort = 'average_rating';
                    params.sort_by = 'DESC';
                }
                if ($state.params.sort === 'id') {
                    params.sort = 'id';
                    params.sort_by = 'DESC';
                }
                if ($state.params.sort === "ASC" || $state.params.sort === "DESC") {
                    params.sort = 'price';
                    params.sort_by = $state.params.sort;
                }
                if ($state.params.sort === 'popular') {
                    params.sort = 'course_user_count';
                    params.sort_by = 'DESC';
                }
                if ($state.params.sort === 'featured') {
                    params.filter = 'is_featured';
                    params.sort_by = 'DESC';
                }
            }
            if ($state.params.price) {
                params.priceType = $state.params.price;
            }
            if ($state.params.instructionLevel) {
                params.instructional_level_id = $state.params.instructionLevel;
            }
            if ($state.params.language) {
                params.language_id = $state.params.language;
            }
            if ($scope.searchingCourseCategory === '' && $scope.searchingCoursePrice === '' && $scope.searchingCourseLanguage === '' && $scope.searchingInstructionLevel === '' && $scope.searchingText === '') {
                $scope.noFiltersUsed = true;
            }
            params.limit = 15;
            params.category_id = $state.params.category_id;
            params.field = 'id,title,slug,subtitle,price,image_hash,user_id,displayname,is_from_mooc_affiliate,course_image,average_rating,active_online_course_lesson_count,instructional_level_name,user_image_hash,course_user_count,parent_category_name,category_name,category_id,parent_category_id,instructional_level_id,designation';
            Course.get(params).$promise.then(function(response) {
                if (response.data) {
                    model.courses = response;
                    $scope._metadata = response._metadata;
                    model.courseLength = response.data.length;
                    model.loading = false;
                }
                if (element !== null && angular.isDefined(element)) {
                    $('html, body').animate({
                        scrollTop: $(element).offset().top
                    }, 1500, 'swing', false);
                }
            });
        }
        $scope.index = function(element) {
            getCourses(element);
        };
        //initial load
        $scope.index(null);
        /**
         * @ngdoc function
         * @name $scope.paginate
         * @function
         *
         * @description
         * Generate the pagination url for current listing
         *
         * @param pageno - pagination no
         * @returns {*} 'Array'
         */
        $scope.paginate = function(element) {
            $scope.currentPage = parseInt($scope.currentPage);
            $scope.index(element);
        };
        $scope.goToState = function(state, params) {
            $state.go(state, params);
        };
        $scope.DropDownItemSelect = function(item, dropdownName) {
            if (dropdownName === 'category') {
                $scope.categorySelected = item.sub_category_name;
            }
            if (dropdownName === 'levels') {
                $scope.levelsSelected = item.name;
            }
            if (dropdownName === 'languages') {
                $scope.languageSelected = item.name;
            }
        };
        $scope.getCurrentCategory = function(category_name) {
            $scope.curent_category_name = category_name;
        };
    }]);
}(angular.module("ace.courses")));
