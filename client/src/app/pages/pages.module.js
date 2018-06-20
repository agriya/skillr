(function(module) {

    module.config(['$stateProvider', function($stateProvider) {
        var getToken = {
            'TokenServiceData': function(TokenService) {
                return TokenService.promiseSettings;
            }
        };
        $stateProvider
            .state('pages', {
                url: '/page/{slug}',
                views: {
                    'main@': {
                        controller: 'pagesController as model',
                        templateUrl: 'pages/pages.tpl.html'
                    }
                },
                data: {

                },
                resolve: getToken
            });
    }]);

}(angular.module('ace.pages', [
    'ui.router',
    'ngResource'
])));

(function(module) {

    module.config(['$stateProvider', function($stateProvider) {
        var getToken = {
            'TokenServiceData': function(TokenService) {
                return TokenService.promiseSettings;
            }
        };
        $stateProvider
            .state('pages', {
                url: '/page/{slug}',
                views: {
                    'main@': {
                        controller: 'pagesController as model',
                        templateUrl: 'pages/pages.tpl.html'
                    }
                },
                data: {

                },
                resolve: getToken
            });
    }]);

}(angular.module('ace.pages', [
    'ui.router',
    'ngResource'
])));
