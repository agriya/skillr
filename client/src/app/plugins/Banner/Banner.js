/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {

}(angular.module('ace.banner', [
    'ui.router',
    'ngResource'

])));

(function(module) {
    module.directive('banner', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'A',
            templateUrl: 'src/app/plugins/Banner/banner.tpl.html',
            link: linker,
            controller: 'bannerController as model',
            bindToController: true,
            scope: {
                position: '@position'
            }
        };
    });
    module.controller('bannerController', function($scope) {
        var model = this;
    });

}(angular.module("ace.banner")));
