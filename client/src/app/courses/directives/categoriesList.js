(function(module) {
    module.directive('categoriesList', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'E',
            templateUrl: 'courses/directives/categories.tpl.html',
            link: linker,
            controller: 'categoriesListController as model',
            bindToController: true,
            scope: {
                filter: '@filter'
            }
        };
    });

    module.controller('categoriesListController', ['CategoriesList', '$modal', '$state', 'TokenService', function(CategoriesList, $modal, $state, TokenService) {
        var model = this;
        filter = model.filter;
        model.common = [];

        if (angular.isDefined(filter)) {
            filter_parent = filter;
        } else {
            filter_parent = "parent";
        }

        CategoriesList.get({
            category_type: filter_parent,
            limit: "all",
            "filter": "active",
            field: "id,sub_category_name"
        }).$promise.then(function(response) {
            model.common.parentCategories = response;
        });
    }]);

})(angular.module('ace.courses'));
