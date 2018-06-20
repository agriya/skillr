/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {
    module.config(function() {

    });

}(angular.module('ace.analytics', [
    'ui.router',
    'ngResource',
    'OcLazyLoad'
])));

(function(module) {
    module.directive('facebookPixel', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here   
        };
        return {
            restrict: 'AE',
            link: linker, 
			controller:function($rootScope, TokenService){
				var promise = TokenService.promise;
				var promiseSettings = TokenService.promiseSettings;
				promiseSettings.then(function(data) {
					if($rootScope.settings){
						!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
							n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
						n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
						t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
							document,'script','//connect.facebook.net/en_US/fbevents.js');
						fbq('init', $rootScope.settings['analytics.facebook_analytics.pixel']);						
					}
				});
			},			
            scope: {
				
            }
        };
    });
})(angular.module('ace.analytics'));

(function(module) {
    module.directive('googleAnalytics', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here			
        };
        return {
            restrict: 'AE',
            link: linker, 
			controller:function($rootScope, TokenService){
			var promise = TokenService.promise;
			var promiseSettings = TokenService.promiseSettings;
			promiseSettings.then(function(data) {
				if($rootScope.settings){
					 (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
					  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
					  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
						})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
					ga('create', $rootScope.settings['analytics.google_analytics.profile_id'], 'auto');
				}
			});
			},
            scope: {
            }
        };
    });

})(angular.module('ace.analytics'));