(function(module) {

    module.config(['$stateProvider', function($stateProvider) {
        var getToken = {
            'TokenServiceData': function(TokenService) {
                return TokenService.promiseSettings;
            }
        };
        $stateProvider
            .state('contact', {
                url: '/contactus',
                views: {
                    'main@': {
                        controller: 'contactUsController as model',
                        templateUrl: 'contactUs/contactUs.tpl.html'
                    }
                },
                data: {

                },
                resolve: getToken
            });
    }]);

}(angular.module('ace.contactUs', [
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
            .state('contact', {
                url: '/contactus',
                views: {
                    'main@': {
                        controller: 'contactUsController as model',
                        templateUrl: 'contactUs/contactUs.tpl.html'
                    }
                },
                data: {

                },
                resolve: getToken
            });
    }]);

}(angular.module('ace.contactUs', [
    'ui.router',
    'ngResource'
])));
