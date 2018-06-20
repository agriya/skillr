(function(module) {
    module.directive('amountDisplay', function() {
        var linker = function(scope, element, attrs) {};
        return {
            restrict: 'E',
            templateUrl: 'courses/directives/amountDisplay.tpl.html',
            link: linker,
            controller: 'amountDisplayController as model',
            bindToController: true,
            scope: {
                amount: '@amount',
                fraction: '@fraction',
                isCoursePrice: '@isCoursePrice'
            }
        };
    });
    module.controller('amountDisplayController', ['$state', '$scope', '$rootScope', function($state, $scope, $rootScope) {
        var model = this;
        $scope.isCoursePrice = model.isCoursePrice;
    }]);
})(angular.module('ace.courses'));
