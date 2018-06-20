(function(module) {
    module.directive('popoverHtmlUnsafePopup', function() {
            return {
                restrict: 'EA',
                replace: true,
                scope: {
                    title: '@',
                    content: '@',
                    placement: '@',
                    animation: '&',
                    isOpen: '&'
                },
                template: '<div class="popover {{placement}}" ng-class="{ in: isOpen(), fade: animation() }" style="z-index:1050;white-space:normal;word-wrap: break-word;"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title" bind-html-unsafe="title" ng-show="title"></h3><div class="popover-content" bind-html-unsafe="content"></div></div></div>'
            };
        })
        .directive('popoverHtmlUnsafe', ['$tooltip', function($tooltip) {
            return $tooltip('popoverHtmlUnsafe', 'popover', 'mouseenter');
        }]);

})(angular.module('ace.users'));
