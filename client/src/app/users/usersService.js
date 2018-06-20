(function(module) {
    module.factory('User', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/users/:id.json', {
            id: '@id'
        }, {
            'update': {
                method: 'PUT'
            },
            'getUser': {
                method: 'GET'
            }
        });
    }]);
    module.factory('UserProfile', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/users/edit-profile.json', {}, {
            'update': {
                method: 'PUT'
            }
        });
    }]);
    module.factory('Login', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/users/login.json', {}, {
            login: {
                method: 'POST'
            }
        });
    }]);
    module.factory('Signup', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/users/register.json', {}, {
            register: {
                method: 'POST'
            }
        });
    }]);
    module.factory('Logout', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/users/logout.json', {}, {
            logout: {
                method: 'GET'
            }
        });
    }]);
    module.factory('UserActivation', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/users/activation.json', {}, {
            activation: {
                method: 'PUT'
            }
        });
    }]);
    module.factory('ForgotPassword', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/users/forgotpassword.json', {}, {
            forgot_password: {
                method: 'POST'
            }
        });
    }]);
    module.factory('ChangePassword', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/users/changepassword.json', {}, {
            change_password: {
                method: 'POST'
            }
        });
    }]);
    module.factory('UserAll', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/users.json', {}, {
            'getUserAll': {
                method: 'GET'
            }
        });
    }]);
    module.factory('Subscriptions', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/subscriptions.json', {}, {
            'getSubscriptions': {
                method: 'GET'
            }
        });
    }]);
})(angular.module("ace.users"));
