(function(module) {
    module.config(['$stateProvider', function($stateProvider) {
        var getToken = {
            'TokenServiceData': function(TokenService) {
                return TokenService.promiseSettings;
            }
        };
        $stateProvider
            .state('common', {
                url: '/header',
                views: {
                    'main@': {
                        controller: 'HeaderController as model',
                        templateUrl: 'common/header.tpl.html'
                    }
                },
                data: {},
                resolve: getToken
            })
            .state('error', {
                url: '/error/:id',
                views: {
                    'main@': {
                        controller: 'errorController as model',
                        templateUrl: 'common/404.tpl.html'
                    }
                },
                data: {},
                resolve: getToken
            });
    }]);

}(angular.module('ace.common', [
    'ui.router',
    'ngResource',
    'OcLazyLoad',
    'ace.users',
    'ace.home'
])));

(function(module) {
    module.config(['$stateProvider', function($stateProvider) {
        var getToken = {
            'TokenServiceData': function(TokenService) {
                return TokenService.promiseSettings;
            }
        };
        $stateProvider
            .state('common', {
                url: '/header',
                views: {
                    'main@': {
                        controller: 'HeaderController as model',
                        templateUrl: 'common/header.tpl.html'
                    }
                },
                data: {},
                resolve: getToken
            })
            .state('error', {
                url: '/error/:id',
                views: {
                    'main@': {
                        controller: 'errorController as model',
                        templateUrl: 'common/404.tpl.html'
                    }
                },
                data: {},
                resolve: getToken
            });
    }]);

}(angular.module('ace.common', [
    'ui.router',
    'ngResource',
    'OcLazyLoad',
    'ace.users',
    'ace.home'
])));
