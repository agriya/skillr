(function(module) {
    module.factory('Pages', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/page/:slug.json', {
                slug: '@slug'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    }]);

})(angular.module("ace.pages"));
