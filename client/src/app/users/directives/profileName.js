(function(module) {
    module.directive('profileName', function() {
        var linker = function(scope, element, attrs) {};
        return {
            restrict: 'E',
            templateUrl: 'users/directives/profileName.tpl.html',
            link: linker,
            controller: 'UserProfileNameController as model',
            bindToController: true,
            scope: {
                userProfileId: '=userProfileId',
                userDesignation: '@userDesignation',
                userNameClass: '@userNameClass',
                loggedUser: '@loggedUser',
                profileWithLabel: '@profileWithLabel',
                userMenuItem: '@UserMenuItem',
                userDisplayName: '=userDisplayName',
                userDesignationText: '@userDesignationText',
                userBiographyText: '@userBiographyText',
                userSmallText: '@userSmallText'
            }
        };
    });

    module.controller('UserProfileNameController', ['$state', '$scope', '$rootScope', 'User', 'TokenService', function($state, $scope, $rootScope, User, TokenService) {
        var model = this;
        UserNameDetails = model.userProfileId;
        $scope.user_id = UserNameDetails;
        var promise = TokenService.promise;
        var promiseSettings = TokenService.promiseSettings;
        promiseSettings.then(function(data) {
            if (angular.isDefined(data['ace.courseWishlist'])) {
                $scope.loadCourseWishlist = data['ace.courseWishlist'];
            }
        });
    }]);
})(angular.module('ace.users'));
