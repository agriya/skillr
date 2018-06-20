(function(module) {

    module.controller('pagesController', ['$scope', '$rootScope', 'Pages', '$state', '$filter', 'TokenServiceData', function($scope, $rootScope, Pages, $state, $filter, TokenServiceData) {
        model = this;
        model.page = [];
        var slugName = ($state.params.slug) ? $state.params.slug : '';
        var params = {};
        params.slug = slugName;
        params.iso2 = $.cookie("currentLocale");
        staticPages();
        $rootScope.$on('changeLanguage', function(event, args) {
            params.iso2 = args.currentLocale;
            staticPages();
        });

        function staticPages() {
            Pages.get(params).$promise
                .then(function(response) {
                    model.page = response.data[0];
                    if (model.page) {
                        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")(model.page.title);
                    } else {
                        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")(slugName);
                    }
                });
        }
    }]);

}(angular.module("ace.pages")));
