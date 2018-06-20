
var ngapp = angular.module('aceadmin', ['ng-admin', 'http-auth-interceptor']);
var admin_api_url = '/acev3/';
var limit_per_page = 20;
var enabledPlugins;
//$httpProvider, it adds token to every request because our API is token based API.

var token = '';
ngapp.config(['$httpProvider',
    function($httpProvider) {
        if (!$.cookie('refresh_token')) {
            var _params = {};
            $.get(admin_api_url + 'api/v1/token.json', _params, function(data) {
                data = angular.fromJson(data);
                if (angular.isDefined(data.access_token)) {
                    token = data.access_token;
                }
            });
        } else {
            token = $.cookie('token');
        }	
		$httpProvider.interceptors.push('interceptor');
        $httpProvider.interceptors.push('oauthTokenInjector');
    }
]);

//oauthTokenInjector, it adds .json to every request 

ngapp.factory('oauthTokenInjector', ['$rootScope', '$timeout',
    function($rootScope, $timeout) {
        var oauthTokenInjector = {
            request: function(config) {
                if (config.url.indexOf('.html') === -1) {
                    if (token) {
                        var sep = config.url.indexOf('?') === -1 ? '?' : '&';
                        config.url = config.url + '.json' + sep + 'token=' + token;
                    }
                }
                return config;
            }
        };
        return oauthTokenInjector;
    }
]);
//Interceptor, this capture the response and process it before completing call
ngapp.factory('interceptor', ['$q', '$location', '$injector', '$rootScope', 'SessionService','$timeout', function($q, $location, $injector, $rootScope, SessionService, $timeout) {
        return {
            // On response success
            response: function(response) {
                if (angular.isDefined(response.data)) {
                    if (angular.isDefined(response.data.error_message) && parseInt(response.data.error) === 1 && response.data.error_message === 'Authentication failed') {
                        SessionService.setUserAuthenticated(false);
                        Auth = Array();
                        token = '';
                        $.removeCookie('auth');
                        $.removeCookie('token');
                        $.removeCookie('refresh_token');
						$.removeCookie('enabled_plugins');
                        window.location = "/#!/users/login";
                    }
				}
                  
                // Return the response or promise.
                return response || $q.when(response);
            },

            // On response failture
            responseError: function(response) {
                // Return the promise rejection.
                return $q.reject(response);
            }
        };
    }]);
//Service to set and get authentication status
ngapp.service('SessionService', ['$rootScope', function($rootScope) {
	var userIsAuthenticated = false;
	this.setUserAuthenticated = function(value) {
		userIsAuthenticated = value;
	};

	this.getUserAuthenticated = function() {
		return userIsAuthenticated;
	};		
}]);
//Customize API Mapping
//Referenced Document Link: http://ng-admin-book.marmelab.com/doc/API-mapping.html	

ngapp.config(['RestangularProvider', function(RestangularProvider) {
    // use the custom query parameters function to format the API request correctly
    RestangularProvider.addFullRequestInterceptor(function(element, operation, what, url, headers, params) {
		// Added this filter param changes for admin and user end listing for same api call - for admin - we send filter=all param for display all active and inactive records
		if(operation === "getList" && (what == 'courses' || what == 'categories' || what == 'users' || what == 'cities' || what == 'states' || what == 'languages' || what == 'providers' || what == 'subscriptions' || what == 'transactions')) {
			if(!params._filters){
				params.filter = {'filter':'all'};
				if(what == 'users') {
					params.filter = {'filter' : 'all', 'providertype' : 'all' };
				}
				if(what == 'users') {
					params.filter = {'filter' : 'all', 'providertype' : 'all' };
				}
				delete params._filter;
			}
		}
		// custom pagination params
		if (params._sortField) {
			params.sort = params._sortField;
		}
		delete params._sortField;
		if (params._sortDir) {
			params.sort_by = params._sortDir;
		}
		delete params._sortDir;
		if (params._perPage !== null && params._perPage !== 'all' && params._page) {
			params._start = (params._page - 1) * params._perPage;
			params._end = params._page * params._perPage;
			//In REST file, we added page and limit query parameters for pagination
			//Get Reference from http://ng-admin-book.marmelab.com/doc/API-mapping.html
			//Keyword - pagination
			params.page = params._page;
			params.limit = params._perPage;
		}
		delete params._start;
		delete params._end;
	
		if (params._perPage === null) {
			params.limit = limit_per_page;
		}
		if(angular.isUndefined(params._perPage)){
			params.limit = 'all';
		}
		//limit('all') is used for dropdown values, our api default limit value is '10', to show all the value we should pass string 'all' in limit parameter.				
		if (params._perPage == 'all') {
			params.limit = 'all';
		}
		delete params._page;
		delete params._perPage;
		// custom sort params
		if (params._sortField) {
			delete params._sortField;
			delete params._sortDir;
		}
		// custom filters
		if (params._filters) {
			params.filter = params._filters;
			delete params._filters;
		}
        return {
            params: params
        };
    });
    //Total Number of Results
    //Our API doesn't return a X-Total-Count header, so we added a totalCount property to the response object using a Restangular response interceptor.
    //Removed metadata info from response
    RestangularProvider.addResponseInterceptor(function(data, operation, what, url, response) {
        if (operation === "getList") {
            var headers = response.headers();
            if (response.data._metadata.total_records !== null) {
                response.totalCount = response.data._metadata.total_records;
            }
        }
        return data;
    });
    //To cutomize single view results, we added setResponseExtractor.
    //Our API Edit view results single array with following data format data[{}], Its not working with ng-admin format
    //so we returned data like data[0];
    RestangularProvider.setResponseExtractor(function(response, operation, what, url) {
        if (response.data) {
            if (operation === "getList") {
                // Use results as the return type, and save the result metadata
                var newResponse = response.data;
                newResponse._metadata = response._metadata;
                return newResponse;
            }
            return response.data[0];
        } else {
            return response;
        }
    });


}]);
//Checking Admin Authentication by checking auth credentials, Redirected to site page if not admin logged in.
ngapp.run(function($rootScope, $location, SessionService) {

    if (!$.cookie('refresh_token')) {
		window.location = "/#!/users/login";
    } else {
        var auth = angular.fromJson($.cookie("auth"));
        if (auth.providertype !== 'admin') {
			window.location = "/";
        } else {
			SessionService.setUserAuthenticated(true);
			$rootScope.$on('$viewContentLoaded', function () {
				$('body').removeClass('site-loading');
				$('div.js-loader').hide();
			});
		}
    }
	//For enabling or disabling plugin based menu items
	$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
	
	});
		
});
//time ago filter using jquery timeago plugin
ngapp.filter("timeago",function() {
		//passed extra argument to get time zome
		return function(date, timeZone) {
			jQuery.timeago.settings.strings = {
				prefixAgo: null,
				prefixFromNow: null,
				suffixAgo: "ago",
				suffixFromNow: "from now",
				seconds: "less than a minute",
				minute: "a minute",
				minutes: "%d minutes",
				hour: "an hour",
				hours: "%d hours",
				day: "a day",
				days: "%d days",
				month: "a month",
				months: "%d months",
				year: "a year",
				years: "%d years",
				wordSeparator: " ",
				numbers: []
			};
			return jQuery.timeago(date + timeZone);
		};
});

//Custom Header
//Referenced Link: http://ng-admin-book.marmelab.com/doc/Dashboard.html
//Above link has details about dashboard customization, we follwed the same steps for header customization.
//Created custom directive for header, reference http://ng-admin-book.marmelab.com/doc/Custom-pages.html keyword - directive.
//Template files created under 'tpl' directory.
ngapp.directive('customHeader', ['$location', '$state', '$http', function($location, $state, $http, $scope) {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: '../ag-admin/tpl/customHeader.tpl.html',
        link: function(scope) {}

    };
}]);
//Custom  Dashboard
//Referenced Link: http://ng-admin-book.marmelab.com/doc/Dashboard.html
//Created custom directive for header, reference http://ng-admin-book.marmelab.com/doc/Custom-pages.html keyword - directive.
//Template files created under 'tpl' directory.
ngapp.directive('dashboardSummary', ['$location', '$state', '$http', function($location, $state, $http) {
    return {
        restrict: 'E',
        scope: {
            entity: "&",
            entityName: "@",
            entry: "&",
            size: "@",
            label: "@",
            revenueDetails: "&"
        },
        templateUrl: '../ag-admin/tpl/dashboardSummary.tpl.html',
        link: function(scope) {

            scope.rangeVal = [{
                "key": "lastDays",
                "value": "Last 7 Days"
            }, {
                "key": "lastWeeks",
                "value": "Last 4 Weeks"
            }, {
                "key": "lastMonths",
                "value": "Last 3 Months"
            }, {
                "key": "lastYears",
                "value": "Last 3 Years"
            }];
            if (scope.rangeText === undefined) {
                scope.rangeText = "Last 7 Days";
            }
            scope.selectedRangeItem = function(rangeVal, rangeText) {
                $http.get(admin_api_url + 'api/v1/admin/stats', {
                    params: {
                        filter: rangeVal
                    }
                }).success(function(response) {
                    scope.adminstats = response.data;
                    scope.rangeText = rangeText;
                });
            };

            $http.get(admin_api_url + 'api/v1/admin/stats').success(function(response) {
                scope.adminstats = response.data;
            });
            $http.get(admin_api_url + 'api/v1/admin/activities').success(function(response) {
                scope.adminactivities = response.data;
            });
            $http.get(admin_api_url + 'api/v1/admin/overview').success(function(response) {
                scope.adminoverview = response.data;
            });
			//getting time zone from settings
			var timeZone;
			$http.get(admin_api_url + 'api/v1/settings.json', { params:{
				limit: 'all'
			}}).success(function(settingsData) {
				settingsResponse = angular.fromJson(settingsData);		   
				$.each(settingsResponse.data, function(i, settingData) {
					if (settingData.name === 'site.timezone') {
						timeZone = settingData.value;
					}
				});
				scope.timeZone = timeZone;				
			});
			scope.enabledPlugins = $.cookie("enabled_plugins");
	
        }
		

    };
}]);
//We need custom pages for online lessons add forms, because ng-admin doesn't support single entity with multiple create view.
//So we created custom pages for online lessons like add articele, add video, add document, add downloadble file and add file.
//Custom directives created for custom pages.
//Template files created under 'tpl' directory.
//Referenced Link: http://ng-admin-book.marmelab.com/doc/Custom-pages.html
ngapp.directive('manageLesson', ['$location', '$state', function($location, $state) {
    return {
        restrict: 'E',
        scope: {
            entity: "&",
            entityName: "@",
            entry: "&",
            size: "@",
            label: "@"
        },
        template: '<a class="btn btn-primary navbar-btn" ng-class="size ? \'btn-\' + size : \'\'" href="../#!manage-course/edit-getting-started/{{id}}" >\n<span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>&nbsp;<span class="hidden-xs">{{label}}</span>\n</a>',
        link: function(scope) {		
		   scope.id =scope.entry().values.id;      
        }
    };
}]);
ngapp.directive('createManageLesson', ['$location', '$state', function($location, $state) {
    return {
        restrict: 'E',
        scope: {
            entity: "&",
            entityName: "@",
            entry: "&",
            size: "@",
            label: "@"
        },
        template: '<a class="btn btn-default" ng-class="size ? \'btn-\' + size : \'\'" href="../#!/courses/add" >\n<span class="glyphicon glyphicon-plus" aria-hidden="true"></span>&nbsp;<span class="hidden-xs"></span>\n</a>',
        link: function(scope) {       
        }
    };
}]);
ngapp.directive('previewThisCourse', ['$location', '$state', function($location, $state) {
    return {
        restrict: 'E',
        scope: {
            entity: "&",
            entityName: "@",
            entry: "&",
            size: "@",
            label: "@"
        },
	template: '<a class="btn btn-primary navbar-btn" ng-class="size ? \'btn-\' + size : \'\'" href="../#!/course/{{id}}/{{slug}}" >\n<span class="glyphicon glyphicon-eye-open" aria-hidden="true"></span>&nbsp;<span class="hidden-xs">{{label}}</span>\n</a>',
        link: function(scope) {		
		   scope.id =scope.entry().values.id;
		   scope.slug =scope.entry().values.slug;
        }
    };
}]);
ngapp.directive('previewLearnPage', ['$location', '$state', function($location, $state) {
    return {
        restrict: 'E',
        scope: {
            entity: "&",
            entityName: "@",
            entry: "&",
            size: "@",
            label: "@"
        },
	template: '<a class="btn btn-primary navbar-btn" ng-class="size ? \'btn-\' + size : \'\'" href="../#!/{{slug}}/learn/{{id}}" >\n<span class="glyphicon glyphicon-book" aria-hidden="true"></span>&nbsp;<span class="hidden-xs">{{label}}</span>\n</a>',
        link: function(scope) {		
		   scope.id =scope.entry().values.id;
		   scope.slug =scope.entry().values.slug;
        }
    };
}]);
ngapp.directive('createPage', ['$location', '$state', function($location, $state) {
    return {
        restrict: 'E',
        scope: {
            entity: "&",
            entityName: "@",
            entry: "&",
            size: "@",
            label: "@"
        },
        template: '<a class="btn btn-default" ng-class="size ? \'btn-\' + size : \'\'" href="#/pages/add" >\n<span class="glyphicon glyphicon-plus" aria-hidden="true"></span>&nbsp;<span class="hidden-xs"></span>\n</a>',
        link: function(scope) {
          
        }
    };
}]);
ngapp.directive('batchDraft', ['$location', '$state',  'notification', '$q','Restangular', function($location, $state, notification, $q , Restangular) {
    return{
		restrict: 'E',
			scope: {
				selection: '=',
				type: '@'
			},
			link: function(scope, element, attrs) {
				const status = attrs.type == 'draft' ? '1' : '1';
				const status_name = attrs.type == 'draft' ? 'Draft' : 'Draft';
				scope.icon = attrs.type == 'draft' ? 'glyphicon-envelope' : 'glyphicon-envelope';
				scope.label = attrs.type == 'draft' ? 'Draft' : 'Draft';
				scope.updateStatus = function() {
					$q.all(scope.selection.map(function(e){Restangular.one('api/v1/courses', e.values.id).get()
						.then(function(courseReponses){return courseReponses.data;})
						.then(function(course){ // your API my support batch updates, this one doesn't, so we iterate
							course.course_status_id = status;
							course.course_status_name = status_name;
							return course.put(); // course.put() is a promise					
						}) // this executes all put() promises in parallel and returns
						.then(function(){$state.reload()})
						.then(function(){notification.log(scope.selection.length + ' Courses status changed to  ' + status_name, { addnCls: 'humane-flatty-success' });})
						.catch(function(){notification.log('A problem occurred, please try again', { addnCls: 'humane-flatty-error' });} )
						}))
				}
			},
			template: '<span ng-click="updateStatus()"><span class="glyphicon {{ icon }}" aria-hidden="true"></span>&nbsp;{{ label }}</span>'
		};
}]);
ngapp.directive('batchActive', ['$location', '$state',  'notification', '$q','Restangular', function($location, $state, notification, $q , Restangular) {
    return{
		restrict: 'E',
			scope: {
				selection: '=',
				type: '@'
			},
			link: function(scope, element, attrs) {
				const status = attrs.type == 'active' ? '3' : '3';
				const status_name = attrs.type == 'active' ? 'Active' : 'Active';
				scope.icon = attrs.type == 'active' ? 'glyphicon-thumbs-up' : 'glyphicon-thumbs-up';
				scope.label = attrs.type == 'active' ? 'Active' : 'Active';
				scope.updateStatus = function() {
					$q.all(scope.selection.map(function(e){Restangular.one('api/v1/courses', e.values.id).get()
						.then(function(courseReponses){return courseReponses.data;})
						.then(function(course){ // your API my support batch updates, this one doesn't, so we iterate
							course.course_status_id = status;
							course.course_status_name = status_name;
							return course.put(); // course.put() is a promise					
						}) // this executes all put() promises in parallel and returns
						.then(function(){$state.reload()})
						.then(function(){notification.log(scope.selection.length + ' Courses status changed to  ' + status_name, { addnCls: 'humane-flatty-success' });})
						.catch(function(){notification.log('A problem occurred, please try again', { addnCls: 'humane-flatty-error' });} )
						}))
				}			
			},
			template: '<span ng-click="updateStatus()"><span class="glyphicon {{ icon }}" aria-hidden="true"></span>&nbsp;{{ label }}</span>'
		};
}]);
ngapp.directive('batchWaitingForApproval', ['$location', '$state',  'notification', '$$q','Restangular', function($location, $state, notification, $q , Restangular) {
    return{
		restrict: 'E',
			scope: {
				selection: '=',
				type: '@'
			},
			link: function(scope, element, attrs) {
				const status = attrs.type == 'waiting' ? '2' : '2';
				const status_name = attrs.type == 'waiting' ? 'Waiting For Approval' : 'Waiting For Approval';
				scope.icon = attrs.type == 'waiting' ? 'glyphicon-thumbs-down' : 'glyphicon-thumbs-down';
				scope.label = attrs.type == 'waiting' ? 'Waiting For Approval' : 'Waiting For Approval';				
				scope.updateStatus = function() {
					$q.all(scope.selection.map(function(e){Restangular.one('api/v1/courses', e.values.id).get()
						.then(function(courseReponses){return courseReponses.data;})
						.then(function(course){ // your API my support batch updates, this one doesn't, so we iterate
							course.course_status_id = status;
							course.course_status_name = status_name;
							return course.put(); // course.put() is a promise					
						}) // this executes all put() promises in parallel and returns
						.then(function(){$state.reload()})
						.then(function(){notification.log(scope.selection.length + ' Courses status changed to  ' + status_name, { addnCls: 'humane-flatty-success' });})
						.catch(function(){notification.log('A problem occurred, please try again', { addnCls: 'humane-flatty-error' });} )
						}))
				}
			},
			template: '<span ng-click="updateStatus()"><span class="glyphicon {{ icon }}" aria-hidden="true"></span>&nbsp;{{ label }}</span>'
		};
}]);
ngapp.directive('batchFeatured', ['$location', '$state',  'notification', '$q','Restangular', function($location, $state, notification, $q , Restangular) {
    return{
		restrict: 'E',
			scope: {
				selection: '=',
				type: '@'
			},
			link: function(scope, element, attrs) {
				const status = attrs.type == 'is_featured' ? true : true;
				const status_name = attrs.type == 'is_featured' ? 'Featured' : 'Featured';
				scope.icon = attrs.type == 'is_featured' ? 'glyphicon-leaf' : 'glyphicon-leaf';
				scope.label = attrs.type == 'is_featured' ? 'Featured' : 'Featured';
				scope.updateStatus = function() {
					$q.all(scope.selection.map(function(e){Restangular.one('api/v1/courses', e.values.id).get()
						.then(function(courseReponses){return courseReponses.data;})
						.then(function(course){ // your API my support batch updates, this one doesn't, so we iterate
							course.is_featured = status;
							return course.put(); // course.put() is a promise					
						}) // this executes all put() promises in parallel and returns
						.then(function(){$state.reload()})
						.then(function(){notification.log(scope.selection.length + ' Courses status changed to  ' + status_name, { addnCls: 'humane-flatty-success' });})
						.catch(function(){notification.log('A problem occurred, please try again', { addnCls: 'humane-flatty-error' });} )
						}))
				}							
			},
			template: '<span ng-click="updateStatus()"><span class="glyphicon {{ icon }}" aria-hidden="true"></span>&nbsp;{{ label }}</span>'
		};
}]);
ngapp.directive('batchUnfeatured', ['$location', '$state',  'notification', '$q','Restangular', function($location, $state, notification, $q , Restangular) {
    return{
		restrict: 'E',
			scope: {
				selection: '=',
				type: '@'
			},
			link: function(scope, element, attrs) {
				const status = attrs.type == 'is_featured' ? false : false;
				const status_name = attrs.type == 'is_featured' ? 'Unfeatured' : 'Unfeatured';
				scope.icon = attrs.type == 'is_featured' ? 'glyphicon-ban-circle' : 'glyphicon-ban-circle'; 
				scope.label = attrs.type == 'is_featured' ? 'Unfeatured' : 'Unfeatured';
				scope.updateStatus = function() {
					$q.all(scope.selection.map(function(e){Restangular.one('api/v1/courses', e.values.id).get()
						.then(function(courseReponses){return courseReponses.data;})
						.then(function(course){ // your API my support batch updates, this one doesn't, so we iterate
							course.is_featured = status;
							return course.put(); // course.put() is a promise					
						}) // this executes all put() promises in parallel and returns
						.then(function(){$state.reload()})
						.then(function(){notification.log(scope.selection.length + ' Courses status changed to  ' + status_name, { addnCls: 'humane-flatty-success' });})
						.catch(function(){notification.log('A problem occurred, please try again', { addnCls: 'humane-flatty-error' });} )
						}))
				}							
			},
			template: '<span ng-click="updateStatus()"><span class="glyphicon {{ icon }}" aria-hidden="true"></span>&nbsp;{{ label }}</span>'
		};
}]);
//Custom button Creation
//Synchronize button to synchronize payment gateways
//Referenced Link: http://ng-admin-book.marmelab.com/doc/reference/View.html
ngapp.directive('addSync', ['$location', '$state', '$http', 'notification',  function($location, $state, $http, notification) {
    return {
        restrict: 'E',
        scope: {
            entity: "&",
            entityName: "@",
            entry: "&",
            size: "@",
            label: "@"
        },
        template: "<a class=\"btn btn-primary\" ng-disabled=\"disableButton\" ng-class=\"{ 'btn-{{size}} hide': syncSudopay === false }\" ng-click=\"sync()\">\n<span class=\"glyphicon glyphicon-resize-small sync-icon\" aria-hidden=\"true\"></span>&nbsp;<span class=\"sync hidden-xs\"> {{label}}</span> <span ng-show=\"disableButton\"><i class=\"fa fa-spinner fa-pulse fa-lg\"></i></span>\n</a>",

        link: function(scope, element) {
			scope.syncSudopay = false;			
			if(scope.entry().values.name === 'SudoPay') {
				scope.syncSudopay = true;
			}
            scope.sync = function() {
				scope.disableButton = true;
                $http.get(admin_api_url + 'api/v1/sudopay_synchronize').success(function(response) {
					if(response.error.code === 1){
						notification.log(response.message,{ addnCls: 'humane-flatty-error'});
					}else{
						notification.log('Synchronized Successfully',{ addnCls: 'humane-flatty-success'});
					}
					scope.disableButton = false;
                });
            };

        }
    };
}]);
//Custom button Creation
//Mooc affliate button to synchronize payment gateways
//Referenced Link: http://ng-admin-book.marmelab.com/doc/reference/View.html
ngapp.directive('moocSync', ['$location', '$state', '$http', 'notification',  function($location, $state, $http, notification) {
    return {
        restrict: 'E',
        scope: {
            entity: "&",
            entityName: "@",
            entry: "&",
            size: "@",
            label: "@"
        },
        template: "<a class=\"btn btn-primary\"  ng-disabled=\"disableButton\" ng-class=\"{ 'btn-{{size}} hide': syncMoocAffliate === false }\"  ng-click=\"moocsync()\">\n<span class=\"glyphicon glyphicon-resize-small sync-icon\" aria-hidden=\"true\"></span>&nbsp;<span class=\"sync hidden-xs\"> {{label}}</span> <span ng-show=\"disableButton\"><i class=\"fa fa-spinner fa-pulse fa-lg\"></i></span>\n</a>",
        link: function(scope) {
			scope.syncMoocAffliate = false;
			if(scope.entry().values.name === 'MOOC Affiliate'){
				scope.syncMoocAffliate = true;
			}
            scope.moocsync = function() {
				scope.disableButton = true;
                $http.get(admin_api_url + 'api/v1/mooc_affiliate_synchronize.json').success(function(response) {
					if(response.error.code === 1){
						notification.log(response.message,{ addnCls: 'humane-flatty-error'});
					}else{
						notification.log('Synchronized Successfully',{ addnCls: 'humane-flatty-success'});
					}
					scope.disableButton = false;
                });
            };

        }
    };
}]);
//Custom directives controlller function called here
function logoutController($scope, $http, $location) {
    $http.get(admin_api_url + 'api/v1/users/logout.json').success(function(response) {
        $scope.response = response;
        $scope.title = 'Logout';
        if (!$scope.response.error) {
            $.get(admin_api_url + 'api/v1/token.json', function(data) {
                data = angular.fromJson(data);
                if (angular.isDefined(data.access_token)) {
                    token = data.access_token;
                    Auth = Array();
                    $.removeCookie('auth');
                    $.removeCookie('token');
                    $.removeCookie('refresh_token');
					$.removeCookie('enabled_plugins');
                    var redirectto = $location.absUrl().split('/#/');
                    redirectto = redirectto[0].split('ag-admin');
                    redirectto = redirectto[0];
                    window.location.href = redirectto;
                    //location.reload(true);
                }
            });
        }
    });
}
//Custom pages controller function
function pagesController($scope, $http, $location, notification) {
	$scope.languageArr = [];
	$http.get(admin_api_url + 'api/v1/settings/site_languages.json', {}).success(function(response) {
		$scope.languageList = response;		
	}, function() {});
	$scope.pageAdd = function(){
		$scope.languageArr.pages['type'] = 'bulk';
		$http.post(admin_api_url + 'api/v1/pages.json', $scope.languageArr.pages).success(function(response) {
			if(response.error.code === 1){
				notification.log(response.message,{ addnCls: 'humane-flatty-error'});
			}else{
				notification.log('Create Element Successfully',{ addnCls: 'humane-flatty-success'});
				$location.path('/pages/list');
			}
		});
	}
}
//plugins controller function
function pluginsController($scope, $http, notification, $state, $window) {
	$scope.languageArr = [];
	getPluginDetails();
	function getPluginDetails(){
		$http.get(admin_api_url + 'api/v1/plugins.json', {}).success(function(response) {
			$scope.course_plugin = response.course_plugin;
			$scope.payment_and_cart_plugin = response.payment_and_cart_plugin;
			$scope.payment_gateway_plugin = response.payment_gateway_plugin;
			$scope.other_plugin = response.other_plugin;
			$scope.enabled_plugin = response.enabled_plugin;
			enabledPlugin = response.enabled_plugin;
			$.cookie('enabled_plugins', JSON.stringify(enabledPlugin), {
							path: '/'
						});
		}, function(error){});
	};
	$scope.checkStatus = function(plugin, enabled_plugins){
		if ($.inArray(plugin, enabled_plugins) > -1) {
            return true;
        }else{
			return false;
		}
	}
	$scope.updatePluginStatus = function(e, plugin_name, status, hash){
		e.preventDefault();
		var target = angular.element(e.target);
        checkDisabled = target.parent().hasClass('disabled');
		if(checkDisabled === true){
			return false;
		}
		var params = {};
		var confirm_msg = '';
		params.plugin_name = plugin_name;
		params.is_enabled = status;
		confirm_msg = (status === 0)?"Are you sure want to disable?":"Are you sure want to enable?";
		notification_msg = (status === 0)?"disabled":"enabled";
		if (confirm(confirm_msg)) {
		   $http.put(admin_api_url + 'api/v1/settings/plugins.json', params).success(function(response) {
				if(response.error.code === 0){
					notification.log(plugin_name+' Plugin '+notification_msg+' successfully.',{ addnCls: 'humane-flatty-success'});				
					getPluginDetails();
				}
			}, function(error){});
		}						
	}
	$scope.fullRefresh = function(){
		$window.location.reload();
	}
}
//Custom directives controlller function called here
//State Provider defined for custom pages.
//Templates created under 'tp' directory and controller functions defined above.
ngapp.config(function($stateProvider) {
    $stateProvider.state('logout', {
            parent: 'main',
            url: '/logout',
            params: {
                id: null
            },
            controller: logoutController,
            controllerAs: 'controller',
        })
		.state('pages', {
            parent: 'main',
            url: '/pages/add',
			templateUrl: '../ag-admin/tpl/pages.tpl.html',
            params: {
                id: null
            },
            controller: pagesController,
            controllerAs: 'controller',
        })
		.state('plugins', {
            parent: 'main',
            url: '/plugins',
			templateUrl: '../ag-admin/tpl/plugins.tpl.html',
            controller: pluginsController,
            controllerAs: 'controller',
        });	
});
//Configuration of the administration 
//All the views for admin entity created here
ngapp.config(['NgAdminConfigurationProvider', function(nga) {
	//enabled plugins details from cookies
	var enabledPlugins = $.cookie("enabled_plugins");
    //trunctate function to shorten text length.
    function truncate(value) {
        if (!value) {
            return '';
        }

        return value.length > 50 ? value.substr(0, 50) + '...' : value;
    }
    // create an admin application
    var admin = nga.application('Admin Panel')
        .baseApiUrl(admin_api_url + 'api/v1/'); // main API endpoint
    // Creating all entities
    // the API endpoint for this entity will be '/acev3/api/v1/courses.json'
    var courses = nga.entity('courses');
    var categories = nga.entity('categories');
    var users = nga.entity('users');
    var course_favourites = nga.entity('course_favourites');
    var course_users = nga.entity('course_users');
    var course_user_feedbacks = nga.entity('course_user_feedbacks');
    var user_logins = nga.entity('user_logins');
    var cities = nga.entity('cities');
    var states = nga.entity('states');
    var countries = nga.entity('countries');
    var instructional_levels = nga.entity('instructional_levels');
    var pages = nga.entity('pages');
    var email_templates = nga.entity('email_templates');
    var languages = nga.entity('languages');
    var transactions = nga.entity('transactions');
    var ipn_logs = nga.entity('ipn_logs');
    var settings = nga.entity('settings');
    var sudopay_payment_gateways = nga.entity('sudopay_payment_gateways');
    var setting_categories = nga.entity('setting_categories');
    var ips = nga.entity('ips');
    var online_course_lessons = nga.entity('online_course_lessons');
    var adminstats = nga.entity('/admin/stats');
    var course_statuses = nga.entity('course_statuses');
    var contacts = nga.entity('contacts');
	var providers = nga.entity('providers');
	var subscriptions = nga.entity('subscriptions');
	var subscription_statuses = nga.entity('subscription_statuses');
	var user_subscription_logs = nga.entity('user_subscription_logs');
	var withdrawal_statuses = nga.entity('withdrawal_statuses');
	var user_cash_withdrawals = nga.entity('user_cash_withdrawals');
	var money_transfer_accounts = nga.entity('money_transfer_accounts');
	var coupons = nga.entity('coupons');
	var subscription_statuses = nga.entity('subscription_statuses');
    //Adding all the entities to the admin application.
    admin.addEntity(courses);
    admin.addEntity(categories);
    admin.addEntity(users);
    admin.addEntity(course_favourites);
    admin.addEntity(course_users);
    admin.addEntity(course_user_feedbacks);
    admin.addEntity(user_logins);
    admin.addEntity(cities);
    admin.addEntity(states);
    admin.addEntity(countries);
    admin.addEntity(instructional_levels);
    admin.addEntity(pages);
    admin.addEntity(email_templates);
    admin.addEntity(languages);
    admin.addEntity(transactions);
    admin.addEntity(ipn_logs);
    admin.addEntity(settings);
    admin.addEntity(sudopay_payment_gateways);
    admin.addEntity(setting_categories);
    admin.addEntity(ips);
    admin.addEntity(online_course_lessons);
    admin.addEntity(adminstats);
    admin.addEntity(contacts);
	admin.addEntity(providers);
	admin.addEntity(subscriptions);
	admin.addEntity(subscription_statuses);
	admin.addEntity(user_subscription_logs);
	admin.addEntity(user_cash_withdrawals);
	admin.addEntity(withdrawal_statuses);
	admin.addEntity(money_transfer_accounts);
	admin.addEntity(coupons);
	admin.addEntity(subscription_statuses);
	
	 //custom template for course list view actions
	 
	var	custom_tmp_course_lst  = '<ma-filter-button filters="filters()" enabled-filters="enabledFilters" enable-filter="enableFilter()"></ma-filter-button>'+
	'<ma-export-to-csv-button entry="entry" entity="entity" size="sm" datastore="::datastore"></ma-export-to-csv-button>'+
	'<create-manage-lesson entry="entry" entity="entity" size="sm" lable=""></create-manage-lesson>';
		
		
    //Set the fields of the course entity list view
    courses.listView().title('Courses') // default title is "[Entity_name] list"
		.filters([
            nga.field('q', 'template').label('Search')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>'), //custom template for search filter
            nga.field('filter', 'choice').label('Status').attributes({
                placeholder: 'Apply Filter'
            })
            .choices([{
                label: 'Draft',
                value: 'Draft'
            }, {
                label: 'Active',
                value: 'Active'
            }, {
                label: 'Waiting for Approval',
                value: 'Waiting for Approval'
            },{
                label: 'Featured',
                value: 'is_featured'
            } ])

        ])
        .infinitePagination(false) // load pages as the user scrolls
        .perPage(limit_per_page)
        .fields([
            nga.field('id'), // The default displayed name is the camelCase field name. label() overrides id
            nga.field('title').label('Course').map(truncate),
            nga.field('displayname').label('Instructor'),
            nga.field('active_online_course_lesson_count').label('Lessons'),
            nga.field('price').cssClasses(function(){
				if(enabledPlugins.indexOf("CourseCheckout") === -1) {
					return "ng-hide";
				}
			}),
            nga.field('course_user_count').label('Students'),
            nga.field('course_user_feedback_count').label('Total Feedback').cssClasses(function(){
				if(enabledPlugins.indexOf("RatingAndReview") === -1) {
					return "ng-hide";
				}
			}),
            nga.field('average_rating').label('Average Rating').cssClasses(function(){
				if(enabledPlugins.indexOf("RatingAndReview") === -1) {
					return "ng-hide";
				}
			}),
            nga.field('total_revenue_amount').label('Revenue').cssClasses(function(){
				if(enabledPlugins.indexOf("CourseCheckout") === -1) {
					return "ng-hide";
				}
			}),
            nga.field('site_revenue_amount').label('Site Revenue').cssClasses(function(){
				if(enabledPlugins.indexOf("CourseCheckout") === -1) {
					return "ng-hide";
				}
			}),
			nga.field('course_status_name').label('Status')
        ])
		.actions(['batch',custom_tmp_course_lst])
		.batchActions([
            '<batch-draft type="draft" selection="selection"></batch-approve>',
			'<batch-active type="active" selection="selection"></batch-active>',
			'<batch-waiting-for-approval type="waiting" selection="selection"></batch-waiting-for-approval>',
			'<batch-featured type="is_featured" selection="selection"></batch-featured>',
			'<batch-unfeatured type="is_featured" selection="selection"></batch-unfeatured>',
            'delete'
        ])
        .listActions(['<manage-lesson entry="entry" entity="entity" size="sm" label="Manage Course & Lessons" ></manage-lesson>','<preview-this-course entry="entry" entity="entity" size="sm" label="Preview" ></preview-this-course>','<preview-learn-page entry="entry" entity="entity" size="sm" label="Learn Page" ></preview-learn-page>','delete']);


    categories.listView().fields([
        nga.field('id').label('ID'),
        nga.field('sub_category_name').label('Category').map(truncate),
        nga.field('parent_category_name').label('Parent Category').map(truncate),
        nga.field('is_active', 'boolean').label('Active?'),
    ]);

    categories.listView().title('Categories') // default title is "[Entity_name] list"
        .description('List of categories and subcategories list') // description appears under the title
        .infinitePagination(false) // load pages as the user scrolls
        .perPage(limit_per_page)
        .filters([
            nga.field('q').label('Search')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>'),
            nga.field('filter', 'choice').label('Status').attributes({
                placeholder: 'Apply Filter'
            })
            .choices([{
                label: 'Active',
                value: 'active'
            }, {
                label: 'Inactive',
                value: 'inactive'
            }, ])
        ])
        .listActions(['edit', 'delete']);
    categories.creationView()
        .fields([
            nga.field('parent_id', 'reference').label('Parent Category')
            .targetEntity(categories)
            .perPage('all') // For getting all list
            .targetField(nga.field('sub_category_name'))
            .remoteComplete(true)
            .permanentFilters({
                parent_id: null
            })
            .attributes({
                placeholder: 'Parent Category'
            }),
            nga.field('name').label('Name')
            .attributes({
                placeholder: 'Name'
            })
            .validation({
                required: true
            }),
            nga.field('is_active', 'choice').label('Active?')
            .choices([{
                label: 'Yes',
                value: true
            }, {
                label: 'No',
                value: false
            }, ])
            .attributes({
                placeholder: 'Active?'
            })
            .validation({
                required: true
            }),
			nga.field('description', 'text').label('Description')
            .attributes({
                placeholder: 'Description'
            })
            .validation({
                required: true
            }),
        ]);
    categories.editionView()
        .title('Edit #{{ entry.values.id }}')
        .fields([
            nga.field('parent_id', 'reference').label('Parent Category')
            .targetEntity(categories)
            .perPage('all') // For getting all list
            .targetField(nga.field('sub_category_name'))
            .remoteComplete(true)
            .permanentFilters({
                parent_id: null
            })
            .attributes({
                placeholder: 'Parent Category'
            }),
            nga.field('sub_category_name')
            .label('Name')
            .validation({
                required: true
            }),
            nga.field('is_active', 'choice')
			.label('Active?')
            .choices([{
                label: 'Yes',
                value: true
            }, {
                label: 'No',
                value: false
            }, ])
            .validation({
                required: true
            }),
			nga.field('description', 'text').label('Description')
            .attributes({
                placeholder: 'Description'
            })
            .validation({
                required: true
            }),

        ]);

    /** user configuration starts**/


    users.listView()
        .fields([
            nga.field('id').label('ID'),
            nga.field('displayname').label('Name'),
            nga.field('email').label('Email'),
            nga.field('active_course_count').label('Active Courses'),
            nga.field('total_earned').label('Earned Amount').cssClasses(function(){
				if(enabledPlugins.indexOf("CourseCheckout") === -1) {
					return "ng-hide";
				}
			}),
            nga.field('total_site_revenue_amount').label('Site Revenue').cssClasses(function(){
				if(enabledPlugins.indexOf("CourseCheckout") === -1) {
					return "ng-hide";
				}
			}),
            nga.field('course_user_count').label('Taken Courses'),
            nga.field('total_spend').label('Spend Amount').cssClasses(function(){
				if(enabledPlugins.indexOf("CourseCheckout") === -1 && enabledPlugins.indexOf("Subscriptions") === -1 ) {
					return "ng-hide";
				}
			}),
            nga.field('user_login_count').label('Logins'),
            nga.field('last_login_ip').label('Last Login IP'),
            nga.field('created').label('Registered On'),
        ])
        .filters([
            nga.field('q').label('Search')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>'),
            nga.field('filter', 'choice').label('Status').attributes({
                placeholder: 'Select Status'
            })
            .choices([{
                label: 'Active',
                value: 'active'
            }, {
                label: 'Inactive',
                value: 'inactive'
            }, ]),
            nga.field('providertype', 'choice').label('User Type').attributes({
                placeholder: 'Select User Type'
            })
            .choices([{
				label: 'Admin',
                value: 'admin'
			}, {
                label: 'User',
                value: 'userpass'
            }, {
                label: 'Instructor',
                value: 'instructor'
            }, ]),
            nga.field('isemailverified', 'choice').label('Email Status').attributes({
                placeholder: 'Email Verified?'
            })
            .choices([{
                label: 'Yes',
                value: 'yes'
            }, {
                label: 'No',
                value: 'no'
            }, ])
        ]);
    // set the fields of the user entity list view
    users.listView().title('Users') // default title is "[Entity_name] list"
        .infinitePagination(false) // load pages as the user scrolls		
        .perPage(limit_per_page)
        .listActions(['show', 'edit', 'delete']);
    users.creationView()
        .fields([
            nga.field('providertype', 'choice').label('User Type')
            .choices([{
                label: 'Admin',
                value: 'admin'
            }, {
                label: 'User',
                value: 'userpass'
            }, ])
            .attributes({
                placeholder: 'User Type'
            })
            .validation({
                required: true
            }),
            nga.field('displayname').label('Name').map(truncate)
            .attributes({
                placeholder: 'Name'
            })
            .validation({
                required: true
            }),
            nga.field('email', 'email').label('Email')
            .attributes({
                placeholder: 'Email'
            })
            .validation({
                required: true
            }),
            nga.field('password', 'password').label('Password')
            .attributes({
                placeholder: 'Password'
            })
            .validation({
                required: true
            }),
            nga.field('is_active', 'choice').label('Active?')
            .attributes({
                placeholder: 'Active?'
            })
            .validation({
                required: true
            })
            .choices([{
                label: 'Yes',
                value: true
            }, {
                label: 'No',
                value: false
            }, ]),
            nga.field('isemailverified', 'choice').label('Email Confirmed?')
            .attributes({
                placeholder: 'Email Confirmed?'
            })
            .validation({
                required: true
            })
            .choices([{
                label: 'Yes',
                value: 1
            }, {
                label: 'No',
                value: 0
            }, ]),
			nga.field('is_teacher', 'choice').label('Instructor?')
            .attributes({
                placeholder: 'Instructor?'
            })
            .validation({
                required: true
            })
            .choices([{
                label: 'Yes',
                value: 1
            }, {
                label: 'No',
                value: 0
            }, ]),
        ]);
    users.editionView()
        .fields([
            nga.field('providertype', 'choice').label('User Type')
            .choices([{
                label: 'Admin',
                value: 'admin'
            }, {
                label: 'User',
                value: 'userpass'
            }, ]).validation({
                required: true
            }),
            nga.field('displayname').label('Name').map(truncate)
            .validation({
                required: true
            }),
			nga.field('available_balance').label('Available Balance')
            .validation({
                required: true
            }),
            nga.field('email', 'email').label('Email')
            .validation({
                required: true
            }),
            nga.field('password', 'password').label('Password'),
            nga.field('is_active', 'choice').label('Active?')
            .validation({
                required: true
            })
            .choices([{
                label: 'Yes',
                value: true
            }, {
                label: 'No',
                value: false
            }, ]),
            nga.field('isemailverified', 'choice').label('Email Confirmed?')
            .validation({
                required: true
            })
            .choices([{
                label: 'Yes',
                value: 1
            }, {
                label: 'No',
                value: 0
            }, ]),
			nga.field('is_teacher', 'choice').label('Instructor?')
            .attributes({
                placeholder: 'Instructor?'
            })
            .validation({
                required: true
            })
            .choices([{
                label: 'Yes',
                value: 1
            }, {
                label: 'No',
                value: 0
            }, ]),
            nga.field('Course Bookings', 'referenced_list') // display list of related course users
            .targetEntity(nga.entity('course_users'))
            .targetReferenceField('user_id')
            .perPage(10)
            .targetFields([
                nga.field('id').label('ID'),
                nga.field('learner_name').label('Student'),
                nga.field('course_user_status').label('Status'),
                nga.field('booked_date').label('Booked On'),
            ]),
            nga.field('', 'template').label('')
            .template('<span class="pull-right"><ma-filtered-list-button entity-name="course_users" filter="{ user_id: entry.values.id }" size="sm"></ma-filtered-list-button></span>'),
            nga.field('Courses', 'referenced_list') // display list of related courses
            .targetEntity(nga.entity('courses'))
            .targetReferenceField('user_id')
            .perPage(10)
            .targetFields([
                nga.field('id').label('ID'), // The default displayed name is the camelCase field name. label() overrides id
                nga.field('title').label('Course').map(truncate),
                nga.field('displayname').label('Instructor'),
                nga.field('total_sub_course_count').label('Lessons'),
                nga.field('price'),
                nga.field('course_user_count').label('Students'),
                nga.field('total_revenue_amount').label('Revenue'),
                nga.field('site_revenue_amount').label('Site Revenue')
            ]),
            nga.field('', 'template').label('')
            .template('<span class="pull-right"><ma-filtered-list-button entity-name="courses" filter="{ user_id: entry.values.id }" size="sm"></ma-filtered-list-button></span>'),
            nga.field('User Logins', 'referenced_list') // display list of related user logins
            .targetEntity(nga.entity('user_logins'))
            .targetReferenceField('user_id')
            .perPage(10)
            .targetFields([
                nga.field('id').label('ID'),
                nga.field('displayname').label('User Name'),
                nga.field('ip').label('IP Address'),
                nga.field('user_agent').label('User Agent')
            ]),
            nga.field('', 'template').label('')
            .template('<span class="pull-right"><ma-filtered-list-button entity-name="user_logins" filter="{ user_id: entry.values.id }" size="sm"></ma-filtered-list-button></span>'),
        ]);
    users.showView()
        .title('Show #{{ entry.values.displayname }}')
        .fields([
            nga.field('id').label('ID'),
            nga.field('displayname').label('Name'),
            nga.field('email').label('Email'),
            nga.field('course_count').label('Courses'),           
            nga.field('course_user_count').label('Taken Courses'),
            nga.field('created').label('Registered On'),
            nga.field('user_login_count').label('Logins'),
            nga.field('last_login_ip').label('Last Login IP'),
            nga.field('Course Bookings', 'referenced_list') // display list of related course users
            .targetEntity(nga.entity('course_users'))
            .targetReferenceField('user_id')
            .perPage(10)
            .targetFields([
                nga.field('id').label('ID'),
                nga.field('learner_name').label('Student'),
                nga.field('course_user_status').label('Status'),
                nga.field('booked_date').label('Booked On'),
            ]),
            nga.field('', 'template').label('')
            .template('<span class="pull-right"><ma-filtered-list-button entity-name="course_users" filter="{ user_id: entry.values.id }" size="sm"></ma-filtered-list-button></span>'),
            nga.field('Courses', 'referenced_list') // display list of related courses
            .targetEntity(nga.entity('courses'))
            .targetReferenceField('user_id')
            .perPage(10)
            .targetFields([
                nga.field('id').label('ID'), // The default displayed name is the camelCase field name. label() overrides id
                nga.field('title').label('Course').map(truncate),
                nga.field('displayname').label('Instructor'),
                nga.field('total_sub_course_count').label('Lessons'),
                nga.field('price'),
                nga.field('course_user_count').label('Students'),
                nga.field('total_revenue_amount').label('Revenue'),
                nga.field('site_revenue_amount').label('Site Revenue')
            ]),
            nga.field('', 'template').label('')
            .template('<span class="pull-right"><ma-filtered-list-button entity-name="courses" filter="{ user_id: entry.values.id }" size="sm"></ma-filtered-list-button></span>'),
            nga.field('User Logins', 'referenced_list') // display list of related user logins
            .targetEntity(nga.entity('user_logins'))
            .targetReferenceField('user_id')
            .perPage(10)
            .targetFields([
                nga.field('id').label('ID'),
                nga.field('displayname').label('User Name'),
                nga.field('ip').label('IP Address'),
                nga.field('user_agent').label('User Agent')
            ]),
            nga.field('', 'template').label('')
            .template('<span class="pull-right"><ma-filtered-list-button entity-name="user_logins" filter="{ user_id: entry.values.id }" size="sm"></ma-filtered-list-button></span>'),
        ]);
    course_favourites.listView().fields([
            //nga.field('id', 'reference_many'),
            nga.field('id').label('ID'),
            nga.field('displayname').label('Student').map(truncate),
            nga.field('course_title').label('Course').map(truncate),
            nga.field('created').label('Created'),
        ])
        .infinitePagination(false) // load pages as the user scrolls		
        .perPage(limit_per_page)
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ]);

    course_favourites.listView().title('Course Wishlist') // default title is "[Entity_name] list"
	    .actions(['batch'])
        .infinitePagination(false) // load pages as the user scrolls	
        .perPage('all') // For getting all list
        .listActions(['delete']);

    course_favourites.showView()
        .title('Show course favourites details')
        .fields([
            nga.field('displayname').label('User Name'),
            nga.field('course_title').label('Course Name'),
            nga.field('created').label('Created Date'),
            nga.field('usr_id').label('User ID')
        ]);

    course_users.listView().title('Course Booking')
        .fields([
            nga.field('id').label('ID'),
            nga.field('course_title').label('Course'),
            nga.field('teacher_name').label('Lecture'),
            nga.field('learner_name').label('Student'),
            nga.field('price').label('Amount').cssClasses(function(){
				if(enabledPlugins.indexOf("CourseCheckout") === -1) {
					return "ng-hide";
				}
			}),
            nga.field('site_commission_amount').label('Site Commission').cssClasses(function(){
				if(enabledPlugins.indexOf("CourseCheckout") === -1) {
					return "ng-hide";
				}
			}),
            nga.field('booked_date').label('Booked On'),
            nga.field('course_user_status').label('Status'),
        ])
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>'),
            nga.field('filter', 'choice').label('Status').attributes({
                placeholder: 'Active?'
            })
            .choices([{
                label: 'Not Started',
                value: 'not_started'
            }, {
                label: 'In Progress',
                value: 'in_progress'
            }, {
                label: 'Completed',
                value: 'completed'
            }, {
                label: 'Archived',
                value: 'archived'
            }, {
                label: 'Payment Pending',
                value: 'payment_pending'
            }, {
                label: 'All Booked List',
                value: 'paid'
            }, ])

        ])
        .listActions(['delete']);
    course_user_feedbacks.listView().title('Course Feedback')
        .fields([
            nga.field('id').label('ID'),
            nga.field('course_id', 'reference').isDetailLink(false)
            .label('Course')
            .targetEntity(nga.entity('courses'))
            .perPage('all') // For getting all list
            .targetField(nga.field('title'))
            .validation({
                required: true
            }),
            nga.field('user_id', 'reference')
            .label('Student')
            .targetEntity(nga.entity('users'))
            .perPage('all') // For getting all list
            .targetField(nga.field('displayname'))
            .validation({
                required: true
            }),
            nga.field('review_title').label('Title'),
            nga.field('feedback').label('Feedback'),
            nga.field('rating').label('Rating'),
        ])
        .perPage(limit_per_page)
        .listActions(['edit', 'delete'])
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ]);
    //custom template for edit view actions, added back button in course user feedback edit view
    var backbtn_template = '<ma-list-button entry="entry" entity="entity" size="sm"></ma-list-button>' +
        '<ma-delete-button entry="entry" entity="entity" size="sm"></ma-delete-button>' +
        '<ma-back-button></ma-back-button>';

    course_user_feedbacks.editionView().title('Edit Course Feedback')
        .fields([
            nga.field('course_user_id').editable(false).label('Book ID'),
            nga.field('course_id', 'reference').editable(false)
            .label('Title')
            .targetEntity(nga.entity('courses'))
            .perPage('all') // For getting all list
            .targetField(nga.field('title').map(truncate)),
            nga.field('user_id', 'reference').editable(false)
            .label('Student')
            .targetEntity(nga.entity('users'))
            .perPage('all') // For getting all list
            .targetField(nga.field('displayname')),
            nga.field('review_title').label('Title')
            .validation({
                required: true
            })
            .attributes({
                placeholder: 'Title'
            }),
            nga.field('feedback', 'text').label('Feedback')
            .validation({
                required: true
            }),
            nga.field('rating', 'choice').label('Rating')
            .validation({
                required: true
            })
            .choices([{
                label: '0',
                value: 0
            }, {
                label: '1',
                value: 1
            }, {
                label: '2',
                value: 2
            }, {
                label: '3',
                value: 3
            }, {
                label: '4',
                value: 4
            }, {
                label: '5',
                value: 5
            }, ]),
        ])
        .actions(backbtn_template); //custom template for course user feedback added to edit view.

    course_user_feedbacks.creationView().title('Create Course Feedback')
        .fields([
            nga.field('course_id', 'reference')
            .label('Course')
            .attributes({
                placeholder: 'Course'
            })
            .targetEntity(nga.entity('courses'))
            .perPage('all') // For getting all list
            .targetField(nga.field('title').map(truncate))
            .validation({
                required: true
            }),
            nga.field('course_user_id', 'reference').attributes({
                placehoder: 'Order Id'
            })
            .label('Order ID')
            .attributes({
                placeholder: 'Order ID'
            })
            .perPage('all') // For getting all list
            .targetEntity(nga.entity('course_users'))
            .targetField(nga.field('id').map(truncate))
            .validation({
                required: true
            }),
            nga.field('user_id', 'reference')
            .label('Student')
            .attributes({
                placeholder: 'Student'
            })
            .targetEntity(nga.entity('users'))
            .perPage('all') // For getting all list
            .targetField(nga.field('displayname'))
            .validation({
                required: true
            }),
            nga.field('review_title').label('Title')
            .validation({
                required: true
            })
            .attributes({
                placeholder: 'Title'
            }),
            nga.field('feedback', 'text').label('Feedback')
            .validation({
                required: true
            })
            .attributes({
                placeholder: 'Feedback'
            }),
            nga.field('rating', 'choice').label('Rating')
            .validation({
                required: true
            })
            .choices([{
                label: '0',
                value: 0
            }, {
                label: '1',
                value: 1
            }, {
                label: '2',
                value: 2
            }, {
                label: '3',
                value: 4
            }, {
                label: '4',
                value: 4
            }, {
                label: '5',
                value: 5
            }, ])
            .attributes({
                placeholder: 'Rating'
            })
        ]);

    user_logins.listView().title('User Logins')
        .fields([
            nga.field('id').label('ID'),
            nga.field('created').label('Login Time'),
            nga.field('displayname').label('User'),
            nga.field('ip').label('IP Address'),
            nga.field('user_agent').label('User Agent'),
        ])
		.actions(['batch'])
        .perPage(limit_per_page)
        .listActions(['delete'])
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ]);

    cities.listView().title('Cities')
        .fields([
            nga.field('id').label('ID'),
            nga.field('name').label('Name'),
            nga.field('state_name').label('State'),
            nga.field('country_name').label('Country'),
            nga.field('is_active', 'boolean').label('Active?'),

        ])
		.perPage(limit_per_page)
        .listActions(['edit', 'delete'])
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>'),
            nga.field('filter', 'choice').label('Status').attributes({
                placeholder: 'Active?'
            })
            .choices([{
                label: 'Active',
                value: 'active'
            }, {
                label: 'Inactive',
                value: 'inactive'
            }, ])
        ])
		.actions(['batch','create','<ma-filter-button filters="filters()" enabled-filters="enabledFilters" enable-filter="enableFilter()"></ma-filter-button>']);

    cities.editionView()
        .fields([
            nga.field('name')
            .label('Name')
            .validation({
                required: true
            }),
            nga.field('state_id', 'reference')
            .label('State')
            .validation({
                required: true
            })
            .targetEntity(nga.entity('states'))
            .perPage('all') // For getting all list
            .targetField(nga.field('name').map(truncate)),
            nga.field('country_id', 'reference')
            .label('Country')
            .validation({
                required: true
            })
            .targetEntity(nga.entity('countries'))
            .perPage('all') // For getting all list
            .targetField(nga.field('name').map(truncate)),
            nga.field('is_active', 'choice').label('Active?')
            .validation({
                required: true
            })
            .choices([{
                label: 'Yes',
                value: true
            }, {
                label: 'No',
                value: false
            }, ])
        ]);

    cities.creationView().fields([
        nga.field('name').label('Name')
        .validation({
            required: true
        })
        .attributes({
            placeholder: 'Name'
        }),
        nga.field('state_id', 'reference')
        .label('State')
        .validation({
            required: true
        })
        .attributes({
            placeholder: 'State'
        })
        .targetEntity(nga.entity('states'))
        .perPage('all') // For getting all list
        .targetField(nga.field('name').map(truncate)),
        nga.field('country_id', 'reference')
        .label('Country')
        .validation({
            required: true
        })
        .attributes({
            placeholder: 'Country'
        })
        .perPage('all') // For getting all list
        .targetEntity(nga.entity('countries'))
        .targetField(nga.field('name').map(truncate)),
        nga.field('is_active', 'choice').label('Active?')
        .validation({
            required: true
        })
        .attributes({
            placeholder: 'Active?'
        })
        .choices([{
            label: 'Yes',
            value: true
        }, {
            label: 'No',
            value: false
        }, ])
    ]);

    states.listView().title('States')
        .fields([
            nga.field('id').label('ID'),
            nga.field('name').label('Name'),
            nga.field('country_name').label('Country'),
            nga.field('is_active', 'boolean').label('Active?'),
        ])
        .perPage(limit_per_page)
        .listActions(['edit', 'delete'])
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>'),
            nga.field('filter', 'choice').label('Status').attributes({
                placeholder: 'Active?'
            })
            .choices([{
                label: 'Active',
                value: 'active'
            }, {
                label: 'Inactive',
                value: 'inactive'
            }, ])
        ])
		.actions(['batch','create','<ma-filter-button filters="filters()" enabled-filters="enabledFilters" enable-filter="enableFilter()"></ma-filter-button>']);

    states.editionView().fields([
        nga.field('name')
        .validation({
            required: true
        })
        .label('State'),
        //.targetEntity(nga.entity('states'))
        //.perPage('all') // For getting all list
        //.targetField(nga.field('name').map(truncate)),
        nga.field('country_id', 'reference')
        .label('Country')
        .validation({
            required: true
        })
        .perPage('all') // For getting all list
        .targetEntity(nga.entity('countries'))
        .targetField(nga.field('name').map(truncate)),
        nga.field('is_active', 'choice').label('Active?')
        .validation({
            required: true
        })
        .choices([{
            label: 'Yes',
            value: true
        }, {
            label: 'No',
            value: false
        }, ])
    ]);

    states.creationView().fields([
        nga.field('name')
        .label('State')
        .validation({
            required: true
        })
        .attributes({
            placeholder: 'State'
        }),
        //.targetEntity(nga.entity('states'))
        //.perPage('all') // For getting all list
        //.targetField(nga.field('name').map(truncate)),
        nga.field('country_id', 'reference')
        .label('Country')
        .validation({
            required: true
        })
        .attributes({
            placeholder: 'Country'
        })
        .perPage('all') // For getting all list
        .targetEntity(nga.entity('countries'))
        .targetField(nga.field('name').map(truncate)),
        nga.field('is_active', 'choice').label('Active?')
        .attributes({
            placeholder: 'Active?'
        })
        .validation({
            required: true
        })
        .choices([{
            label: 'Yes',
            value: true
        }, {
            label: 'No',
            value: false
        }, ])
    ]);

    countries.listView().title('Countries')
        .fields([
            nga.field('id').label('ID'),
            nga.field('name').label('Name'),
            nga.field('iso2').label('ISO2'),
        ])
		.actions(['batch','create'])
        .perPage(limit_per_page)
        .listActions(['edit', 'delete'])
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ]);


    countries.editionView().title('Countries')
        .fields([
            nga.field('name')
			.label('Name')
			.validation({ required: true }),
            nga.field('iso2')
			.label('ISO2')
			.attributes({ placeholder: '2 character allowed' })
			.validation({ validator: function(value) {
			    if (value.length !== 2) throw new Error ('ISO2 should be 2 characters');
	        } })
        ]);

    countries.creationView().title('Add Country')
        .fields([
            nga.field('name').label('Country')
            .validation({
                required: true
            })
            .attributes({
                placeholder: 'Country'
            }),
            nga.field('iso2')
			.label('ISO2')
			.attributes({ placeholder: '2 character allowed' })
			.validation({ validator: function(value) {
			    if (value.length !== 2) throw new Error ('ISO2 should be 2 characters');
	        } })
        ]);

    instructional_levels.listView().title('Instructional Levels')
        .fields([
            nga.field('id').label('ID'),
            nga.field('name').label('Name'),
            nga.field('active_course_count').label('Courses'),
        ])
		.actions(['batch','create'])
        .perPage(limit_per_page)
        .listActions(['edit', 'delete'])
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ]);

    instructional_levels.creationView().title('Add Instructional Level')
        .fields([
            nga.field('name').label('Name')
            .validation({
                required: true
            })
            .attributes({
                placeholder: 'Name'
            }),
        ]);

    instructional_levels.editionView().title('Edit Instructional Level')
        .fields([
            nga.field('name').label('Name')
            .validation({
                required: true
            }),
        ]);
	var	pages_custom_tmp  = '<ma-filter-button filters="filters()" enabled-filters="enabledFilters" enable-filter="enableFilter()"></ma-filter-button>'+
	'<create-page entry="entry" entity="entity" size="sm" lable=""></create-page>';
	
    pages.listView().title('Pages')
        .fields([
            nga.field('id').label('ID'),
			nga.field('language_id', 'reference')
            .label('Language')
            .targetEntity(nga.entity('languages'))
            .perPage('all') // For getting all list
            .targetField(nga.field('name'))
            .validation({
                required: true
            }),
            nga.field('title').label('Title').map(truncate),
            nga.field('content').label('Content').map(truncate),
			nga.field('slug').label('Page Slug'),
        ])
        .perPage(limit_per_page)
        .listActions(['show','edit', 'delete'])
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ])
		.actions(['batch',pages_custom_tmp]);
	
	pages.showView().title('Pages - {{ entry.values.id }}')
        .fields([
			nga.field('language_id', 'reference')
            .label('Language')
            .targetEntity(nga.entity('languages'))
            .perPage('all') // For getting all list
            .targetField(nga.field('name')),
            nga.field('title').label('Title'),
            nga.field('content', 'wysiwyg').label('Content'),
			nga.field('slug').label('Page Slug')
        ]);
  
    pages.editionView().title('Pages - {{ entry.values.title }}')
        .fields([
            nga.field('title')
            .validation({
                required: true
            })
            .label('Title'),
            nga.field('content', 'wysiwyg')
            .stripTags(true)
            .validation({
                required: true
            }),
            nga.field('slug')
            .label('Page Slug')
            .validation({
                required: true
            })
        ]);

    email_templates.listView().title('Email Templates')
        .fields([
            nga.field('id').label('ID'),
            nga.field('name').label('Name'),
            nga.field('from_name').label('From Name'),
            nga.field('subject').label('Subject'),
            nga.field('content').label('Content'),
        ])
		.actions(['batch'])
        .perPage(limit_per_page)
        .listActions(['edit'])
        .batchActions([])
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ]);

    email_templates.editionView().title('Edit Email Template')
        .fields([
            nga.field('name').editable(false).label('Name'),
            nga.field('from_name')
            .label('From Name')
            .validation({
                required: true
            }),
            nga.field('subject')
            .label('Subject')
            .validation({
                required: true
            }),          
			nga.field('content', 'text').label('Content')            
            .validation({
                required: true
            }),
            nga.field('info').editable(false).label('Constant for Subject and Content'),
        ]);

    languages.listView().title('Languages')
        .fields([
            nga.field('id').label('ID'),
            nga.field('name').label('Name'),
            nga.field('iso2').label('ISO2'),
            nga.field('is_active', 'boolean').label('Active?'),
        ])
        .perPage(limit_per_page)
        .listActions(['edit', 'delete'])
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>'),
            nga.field('filter', 'choice').label('Status').attributes({
                placeholder: 'Active?'
            })
            .choices([{
                label: 'Active',
                value: 'active'
            }, {
                label: 'Inactive',
                value: 'inactive'
            }, ])
        ])
		.actions(['batch','create','<ma-filter-button filters="filters()" enabled-filters="enabledFilters" enable-filter="enableFilter()"></ma-filter-button>']);


    languages.creationView().title('Create Language')
        .fields([
            nga.field('name').label('Name')
            .validation({
                required: true
            })
            .attributes({
                placeholder: 'Name'
            }),
			nga.field('iso2')
			.label('ISO2')
			.attributes({ placeholder: '2 character allowed' })
			.validation({ validator: function(value) {
			    if (value.length !== 2) throw new Error ('ISO2 should be 2 characters');
	        }}),
            nga.field('is_active', 'choice').label('Active?')
            .validation({
                required: true
            })
            .choices([{
                label: 'Yes',
                value: true
            }, {
                label: 'No',
                value: false
            }, ])
        ]);

    languages.editionView().title('Edit Language')
        .fields([
            nga.field('name')
            .label('Name')
            .validation({
                required: true
            }),
			nga.field('iso2')
			.label('ISO2')
			.attributes({ placeholder: '2 character allowed' })
			.validation({ validator: function(value) {
			    if (value.length !== 2) throw new Error ('ISO2 should be 2 characters');
	        }}),
            nga.field('is_active', 'choice').label('Active?')
            .validation({
                required: true
            })
            .choices([{
                label: 'Yes',
                value: true
            }, {
                label: 'No',
                value: false
            }, ])
        ]);

    transactions.listView().title('Transactions')
        .fields([
            nga.field('id').label('ID'),
            nga.field('course_title').label('Course'),
            nga.field('displayname').label('User'),
            nga.field('amount').label('Amount'),
            nga.field('site_commission_amount').label('Site Commission'),
        ])
        .listActions(['delete'])
        .perPage(limit_per_page)
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ]);

    ipn_logs.listView().title('IPN Logs')
        .fields([
            nga.field('id').label('ID'),
            nga.field('post_variable').label('Post Variables').map(truncate),
            //nga.field('ip').label('IP'),
			nga.field('ip_id', 'reference')
            .label('Ip Address')
            .targetEntity(nga.entity('ips'))
            .targetField(nga.field('ip'))
			.validation({
                required: true
            }),
        ])
		.actions(['batch'])
        .listActions(['show','delete'])
        .perPage(limit_per_page)
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ]);
	
	ipn_logs.showView().title('IPN Logs - {{ entry.values.id }}')
        .fields([
            nga.field('id').label('ID'),
            nga.field('post_variable').cssClasses(function() {
				return 'line-break col-sm-10 col-md-8 col-lg-7 ';
			})
			.label('Post Variables'),
            nga.field('ip_id', 'reference')
            .label('Ip Address')
            .targetEntity(nga.entity('ips'))
            .targetField(nga.field('ip'))
			.validation({
                required: true
            }),
        ]);

    

    var setting_edit_template = '<ma-back-button></ma-back-button>';

    settings.editionView().title('Edit - {{entry.values.label}}')
        .fields([
            nga.field('label').editable(false).label('Name'),
			nga.field('description').editable(false).label('Description'),
            nga.field('value', 'text').label('Value')
            .validation({
                validator: function(value, entry) {
                    if (entry.name === "payment.is_live_mode" || entry.name === "paypal.is_live_mode" || entry.name === "course.is_auto_approval_enabled" || entry.name === "facebook.is_enabled_facebook_comment" || entry.name === "disqus.is_enabled_disqus_comment" || entry.name === "analytics.is_enabled_facebook_pixel" || entry.name === "analytics.is_enabled_google_analytics" || entry.name === "paypal.is_paypal_enabled_for_payments" || entry.name === "payment.is_sudopay_enabled_for_payments" || entry.name === "video.is_enabled_promo_video" || entry.name === "video.is_keep_original_video_file_in_server") {
                        if (value !== "0" && value !== "1") {
                            throw new Error('Value must be either 0 or 1');
                        }
                    }
					else if(entry.name === "course.max_course_fee"){
						if (isNaN(value)) {
							 throw new Error('Value must be numeric');
						}
					}else if(entry.name === "video.max_size_to_allow_video_file"){
						if (isNaN(value)) {
							 throw new Error('Value must be numeric');
						}
					}
                }
            })
        ])
        .actions(setting_edit_template);
    //custom button template for settings actions
    sudopay_payment_gateways.listView().title('SudoPay Payment Gateways')
        .fields([
            nga.field('sudopay_gateway_id').label('Gateway ID'),
            nga.field('sudopay_gateway_name').label('Gateway Name'),
            nga.field('supported_features_actions').label('Supported Actions'),
            nga.field('supported_features_currencies').label('Supported Currencies'),
            nga.field('supported_features_countries	').label('Supported Countries	'),
        ])
        .batchActions([])
        .perPage(limit_per_page)
        .actions('<ma-filter-button filters="filters()" enabled-filters="enabledFilters" enable-filter="enableFilter()"></ma-filter-button>') //custom button added to settings actions
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ]);
    var setting_category_list_tpl = '<ma-edit-button entry="entry" entity="entity" size="sm" label="Configure" ></ma-edit-button>';
    var	setting_category_action_tpl  = '<ma-filter-button filters="filters()" enabled-filters="enabledFilters" enable-filter="enableFilter()"></ma-filter-button>';
	setting_categories.listView().title('Site Settings')
        .fields([
            nga.field('id').label('ID'),
            nga.field('name').label('Name'),
            nga.field('description').label('Description'),
        ])
        .batchActions([])
        .perPage(limit_per_page)
		.actions(setting_category_action_tpl)
        .listActions(setting_category_list_tpl)
        
	settings_category_edit_template ='<ma-list-button entry="entry" entity="entity" size="sm"></ma-list-button>';
    setting_categories.editionView().title('Edit Settings')
        .fields([
            nga.field('name').editable(false).label('Name'),
            nga.field('description').editable(false).label('Description'),			 
            nga.field('Related Settings', 'referenced_list') // display list of related settings
            .targetEntity(nga.entity('settings'))
            .targetReferenceField('setting_category_id')
            .targetFields([
                nga.field('label').label('Name'),
                nga.field('value').label('Value')
            ])			
            .listActions(['edit']),
			nga.field('', 'template').label('').template('<add-sync entry="entry" entity="entity" size="sm" label="Synchronize with SudoPay" ></add-sync>'),
			nga.field('', 'template').label('').template('<mooc-sync entry="entry" entity="entity" size="sm" label="Synchronize with Mooc Affliate" ></mooc-sync>'),			
        ])
        .actions(settings_category_edit_template);

    ips.listView().title('IPs')
        .fields([
            nga.field('id').label('ID'),
            nga.field('ip').label('IP'),
            nga.field('city_name')
            .label('City')
            .map(truncate),
            nga.field('state_name')
            .label('State')
            .map(truncate),
            nga.field('country_name')
            .label('Country')
            .map(truncate),
            nga.field('latitude').label('Latitude'),
            nga.field('longitude').label('Longitude'),
        ])
		.actions(['batch'])
		.listActions(['delete'])
        .perPage(limit_per_page)
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ]);
    contacts.listView().title('Contacts')
        .fields([
            nga.field('id').label('ID'),
            nga.field('first_name').label('First Name'),
            nga.field('last_name').label('Last Name'),
            nga.field('email').label('Email'),
            nga.field('subject').label('Subject'),
            nga.field('message').label('Message'),
            nga.field('ip').label('IP')
        ])
		.actions(['batch'])
		.listActions(['show', 'delete'])
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ]);

    contacts.showView().title('Contact - {{ entry.values.id }}')
        .fields([
            nga.field('id').label('ID'),
            nga.field('first_name').label('First Name'),
            nga.field('last_name').label('Last Name'),
            nga.field('email').label('Email'),
            nga.field('subject').label('Subject'),
            nga.field('message').label('Message'),
            nga.field('ip').label('IP')

        ]);
    online_course_lessons.editionView().disable();
    // attach the admin application to the DOM and execute it
	providers.listView().title('Providers') // @todo @boopathi - need to move "Social Login" plugin
        .fields([
            nga.field('id').label('ID'),
            nga.field('name').label('Name'),
			nga.field('api_key').label('Client ID'),
			nga.field('secret_key').label('Secret Key'),
			nga.field('display_order').label('Display Order'),
			nga.field('is_active', 'boolean').label('Active?'),
        ])
		.actions(['batch'])
		.listActions(['edit'])
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ]);
	providers.editionView().title('Providers') // @todo @boopathi - need to move "Social Login" plugin
        .fields([
            nga.field('name')
			.label('Name')
			.validation({
                required: true
            }),
			nga.field('api_key').label('Client ID')
			.validation({
                required: true
            }),
			nga.field('secret_key').label('Secret Key')
			.validation({
                required: true
            }),
			nga.field('display_order')
			.label('Display Order')
			.validation({
                required: true
            }),
			nga.field('is_active', 'choice').label('Active?')
            .validation({
                required: true
            })
            .choices([{
                label: 'Yes',
                value: true
            }, {
                label: 'No',
                value: false
            }, ])
        ]);
		
	subscriptions.listView().title('Subscription Plans') // @todo @boopathi - need to move "Subscriptions" plugin
        .fields([
            nga.field('id').label('ID'),
            nga.field('name').label('Name'),
			nga.field('price').label('Price'),
			nga.field('interval_period').label('Interval Period'),
			nga.field('interval_unit').label('Interval Unit'),
			nga.field('is_active', 'boolean').label('Active?'),
        ])
		.actions(['batch','create'])
		.listActions(['edit','delete'])
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ]);
	subscriptions.editionView().title('Edit - {{ entry.values.name }}')// @todo @boopathi - need to move "Subscriptions" plugin
        .fields([
            nga.field('name').label('Name')
			.validation({
                required: true
            }),
			nga.field('price', 'number').label('Price')
			.validation({
                required: true
            })
			.template('<input type="number" name="price" ng-model="value" placeholder="Price" min="1" step="0.01" class="form-control"></input>'),
			nga.field('interval_period', 'number').label('Interval Period')
			.validation({
                required: true
            })
			.template('<input type="number" name="interval_period" ng-model="value" placeholder="Interval Period" min="1" class="form-control"></input>'),
			nga.field('interval_unit', 'choice').label('Interval Unit')
			.validation({
                required: true
            })
            .attributes({
                placeholder: 'Interval Unit by Days / Month'
            })
            .choices([{
                label: 'Days',
                value: 'Days'
            }, {
                label: 'Month',
                value: 'Month'
            }]),
			nga.field('instruction_levels', 'reference_many').label('Instruction Levels to Access')
			.targetEntity(instructional_levels)
			.targetField(nga.field('name'))
			.remoteComplete(true) 
			.singleApiCall(function (tagIds) {
              return { 'instruction_level_id': tagIds };
			})
            .validation({
                required: true
            }),
			nga.field('description', 'wysiwyg').label('Description')
            .validation({
                required: true
            })
            .attributes({
                placeholder: 'Description'
            }),
			nga.field('is_active', 'choice').label('Active?')
            .validation({
                required: true
            })
            .choices([{
                label: 'Yes',
                value: true
            }, {
                label: 'No',
                value: false
            }])
        ]);
	
	subscriptions.creationView().title('Create Subscription Plan')  // @todo @boopathi - need to move "Subscriptions" plugin
        .fields([
            nga.field('name').label('Name')
            .validation({
                required: true
            })
            .attributes({
                placeholder: 'Name'
            }),
            nga.field('price', 'number').label('Price')
            .validation({
                required: true
            })
            .attributes({
                placeholder: 'Price'
            })
			.template('<input type="number" name="price" ng-model="value" placeholder="Price" min="1" step="0.01" class="form-control"></input>'),
            nga.field('interval_period', 'number').label('Interval Period')
            .validation({
                required: true
            })
            .attributes({
                placeholder: 'Interval Period'
            })
			.template('<input type="number" name="interval_period" ng-model="value" placeholder="Interval Period" min="1" class="form-control"></input>'),
            nga.field('interval_unit', 'choice').label('Interval Unit')
            .validation({
                required: true
            })
            .attributes({
                placeholder: 'Interval Unit by Days / Month'
            })
            .choices([{
                label: 'Days',
                value: 'Days'
            }, {
                label: 'Month',
                value: 'Month'
            }]),
			nga.field('instruction_levels', 'reference_many').label('Instruction Levels to Access')
			.targetEntity(instructional_levels)
			.targetField(nga.field('name'))
			.remoteComplete(true) 
			.singleApiCall(function (tagIds) {
              return { 'instruction_level_id': tagIds };
			})
            .validation({
                required: true
            }),
			nga.field('description', 'wysiwyg').label('Description')
            .validation({
                required: true
            })
            .attributes({
                placeholder: 'Description'
            }),
			nga.field('is_active', 'choice').label('Active?')
            .validation({
                required: true
            })
            .choices([{
                label: 'Yes',
                value: true
            }, {
                label: 'No',
                value: false
            }])
        ]);
		
	user_subscription_logs.listView().title('Subscriptions') // @todo @boopathi - need to move "Subscriptions" plugin
        .fields([
            nga.field('id').label('ID'),
			nga.field('user_id', 'reference')
            .label('User')
            .targetEntity(nga.entity('users'))
            .targetField(nga.field('displayname')),	
			nga.field('subscription_id', 'reference')
            .label('Subscription')
            .targetEntity(nga.entity('subscriptions'))
            .targetField(nga.field('name')),
			nga.field('amount').label('Amount'),
			nga.field('subscription_start_date', 'datetime').label('Subscription start date'),
			nga.field('subscription_end_date', 'datetime').label('Subscription end date'),
			nga.field('subscription_status_id', 'reference')
            .label('Status')
            .targetEntity(nga.entity('subscription_statuses'))
            .targetField(nga.field('name')),	
        ]).listActions(['edit','delete'])
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ]);
	user_subscription_logs.editionView().title('Subscription') // @todo @boopathi - need to move "Subscriptions" plugin
        .fields([
			nga.field('user_id', 'reference')
            .label('User')
            .targetEntity(nga.entity('users'))
            .targetField(nga.field('displayname'))
            .validation({
                required: true
            }),	
			nga.field('subscription_id', 'reference')
            .label('Subscription')
            .targetEntity(nga.entity('subscriptions'))
            .targetField(nga.field('name'))
            .validation({
                required: true
            }),
			nga.field('amount').label('Amount'),
			nga.field('subscription_start_date', 'datetime').label('Subscription start date'),
			nga.field('subscription_end_date', 'datetime').label('Subscription end date'),
			nga.field('subscription_status_id', 'reference')
            .label('Subscription Status')
			.attributes({
                placeholder: 'Status'
            })
            .perPage('all') // For getting all list
            .targetEntity(nga.entity('subscription_statuses'))
            .targetField(nga.field('name'))
            .validation({
                required: true
            }),				
        ]);
		
	user_cash_withdrawals.listView().title('Withdraw Requests')
		.infinitePagination(false) // load pages as the user scrolls		
        .perPage(limit_per_page)
        .fields([
            nga.field('id').label('ID'),
			nga.field('created').label('Created'),
			nga.field('user_id', 'reference')
            .label('User')
            .targetEntity(nga.entity('users'))
            .targetField(nga.field('displayname')),
            nga.field('amount').label('Amount'),
			nga.field('withdrawal_status_name').label('Status'),
			nga.field('money_transfer_account_name').label('Money Transfer Account'),
        ])
		.listActions(['edit', 'delete'])
        .filters([
            nga.field('q').label('Search')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>'),
            nga.field('filter', 'choice').label('Status').attributes({
                placeholder: 'Select Status'
            })
            .choices([{
                label: 'Pending',
                value: 'Pending'
            }, {
                label: 'Under Process',
                value: 'Under Process'
            }, {
                label: 'Rejected',
                value: 'Rejected'
            }, {
                label: 'Amount Transferred',
                value: 'Amount Transferred'
            }, ])
        ]);
		
	user_cash_withdrawals.editionView().title('Edit Withdraw Requests')
        .fields([
            nga.field('amount')
            .label('Amount')
            .validation({
                required: true
            })
			.template('<input type="number" name="amount" ng-model="value" placeholder="Amount" min="1" step="0.01" class="form-control"></input>'),
            nga.field('withdrawal_status_id', 'choice').label('Status')
            .validation({
                required: true
            })
            .choices([{
                label: 'Pending',
                value: 1
            }, {
                label: 'Under Process',
                value: 2
            }, {
                label: 'Rejected',
                value: 3
            }, {
                label: 'Amount Transferred',
                value: 4
            }, ])
        ]);
		
	coupons.listView().title('Coupons') // 
        .fields([
            nga.field('id').label('ID'),
			nga.field('teacher_user_id', 'reference')
            .label('Teacher Name')
            .targetEntity(nga.entity('users'))
            .targetField(nga.field('displayname'))
            .validation({
                required: true
            }),
			nga.field('course_id', 'reference')
            .label('Course')
            .targetEntity(nga.entity('courses'))
            .targetField(nga.field('title'))
            .validation({
                required: true
            }),
			nga.field('coupon_code').label('Coupon Code'),
			nga.field('max_number_of_time_can_use').label('Max Number of Time Can Use This Coupon'),
			nga.field('coupon_user_count').label('Coupon Used Count'),
			nga.field('is_active', 'boolean').label('Active?'),
        ])
		.actions(['batch', 'create'])
		.listActions(['edit','delete'])
        .filters([
            nga.field('q').label('Search', 'template')
            .pinned(true)
            .template('<div class="input-group"><input type="text" ng-model="value" placeholder="Search" class="form-control"></input><span class="input-group-addon"><i class="fa fa-search text-primary"></i></span></div>')
        ]);
		
	coupons.creationView().title('Add Coupon')
        .fields([
			nga.field('course_id', 'reference')
			.label('Course')
			.validation({
				required: true
			})
			.attributes({
				placeholder: 'Course'
			})
			.perPage('all') // For getting all list
			.targetEntity(nga.entity('courses'))
			.targetField(nga.field('title').map(truncate)),
            nga.field('max_number_of_time_can_use')
            .label('Max Number of Time Can Use This Coupon')
            .validation({
                required: true
            })
			.template('<input type="number" name="max_number_of_time_can_use" ng-model="value" placeholder="No of Coupons" min="1" class="form-control"></input>'),
			nga.field('is_active', 'choice').label('Active?')
            .validation({
                required: true
            })
            .choices([{
                label: 'Yes',
                value: true
            }, {
                label: 'No',
                value: false
            }])
        ]);
		
	coupons.editionView().title('Edit Coupon')
        .fields([
            nga.field('course_id', 'reference').editable(false)
			.label('Course')
			.perPage('all') // For getting all list
			.targetEntity(nga.entity('courses'))
			.targetField(nga.field('title').map(truncate)),
			nga.field('teacher_user_id', 'reference').editable(false)
			.label('Teacher')
			.perPage('all') // For getting all list
			.targetEntity(nga.entity('users'))
			.targetField(nga.field('displayname').map(truncate)),
            nga.field('max_number_of_time_can_use')
            .label('Max Number of Time Can Use This Coupon')
            .validation({
                required: true
            })
			.template('<input type="number" name="max_number_of_time_can_use" ng-model="value" placeholder="No of Coupons" min="1" class="form-control"></input>'),
			nga.field('is_active', 'choice').label('Active?')
            .validation({
                required: true
            })
            .choices([{
                label: 'Yes',
                value: true
            }, {
                label: 'No',
                value: false
            }])
        ]);
	
    
    //Menu configuration
	
    admin.menu(nga.menu()
        .addChild(nga.menu().title('Courses').icon('<span class="glyphicon glyphicon-education"></span>')
            .addChild(nga.menu(courses).title('Courses').icon('<span class="fa fa-tasks"></span>'))
            .addChild(nga.menu(categories).title('Categories').icon('<span class="fa fa-th"></span>'))
            .addChild(nga.menu(course_users).title('Course Bookings').icon('<span class="fa fa-edit"></span>'))           						
        )
        .addChild(nga.menu().title('Users').icon('<span class="glyphicon glyphicon-user"></span>')
            .addChild(nga.menu(users).title('Users').icon('<span class="fa fa-users"></span>'))
            .addChild(nga.menu(contacts).title('Contacts').icon('<span class="fa fa-users"></span>'))						
			.addChild(nga.menu(user_logins).title('User Logins').icon('<span class="fa fa-user-plus"></span>'))
        )
        .addChild(nga.menu().title('Payments & Logs').icon('<span class="glyphicon glyphicon-usd"></span>')                      
           
        )
        .addChild(nga.menu().title('Settings').icon('<span class="glyphicon glyphicon-cog"></span>')
            .addChild(nga.menu(setting_categories).title('Site Settings').icon('<span class="fa fa-cog"></span>'))
        )
        .addChild(nga.menu().title('Master').icon('<span class="glyphicon glyphicon-dashboard"></span>')			
            .addChild(nga.menu(pages).title('Pages').icon('<span class="fa fa-table"></span>'))
            .addChild(nga.menu(cities).title('Cities').icon('<span class="fa fa-flag"></span>'))
            .addChild(nga.menu(states).title('States').icon('<span class="fa fa-globe"></span>'))
            .addChild(nga.menu(countries).title('Countries').icon('<span class="fa fa-globe"></span>'))
            .addChild(nga.menu(instructional_levels).title('Instructional Levels').icon('<span class="fa fa-file-text-o"></span>'))
            .addChild(nga.menu(email_templates).title('Email Templates').icon('<span class="fa fa-inbox"></span>'))
            .addChild(nga.menu(languages).title('Languages').icon('<span class="fa fa-language"></span>'))
            .addChild(nga.menu(ips).title('IPs').icon('<span class="fa fa-barcode"></span>'))
        )				
        .addChild(nga.menu(subscriptions).title('Plugins').icon('<span class="fa fa-th-large"></span>').link("/plugins"))
	);	
	if(angular.isDefined(enabledPlugins)){
		if(enabledPlugins.indexOf("Subscriptions") > -1) {
			admin.menu().getChildByTitle('Master')
			.addChild(nga.menu(subscriptions).title('Subscription Plans').template('<a  href="#/subscriptions/list"><span class="fa fa-users"></span> Subscription Plans</a>'));
			admin.menu().getChildByTitle('Users')
			.addChild(nga.menu(user_subscription_logs).title('User Subscriptions').template('<a href="#/user_subscription_logs/list"><span class="fa fa-users"></span> User Subscriptions</a>'))
		}
		if(enabledPlugins.indexOf("Withdrawal") > -1) {
			admin.menu().getChildByTitle('Users')
			.addChild(nga.menu(user_cash_withdrawals).title('Withdraw Requests').template('<a href="#/user_cash_withdrawals/list"><span class="fa fa-cog"></span> Withdraw Requests</a>'))
		}
		
		if(enabledPlugins.indexOf("SocialLogins") > -1) {
			admin.menu().getChildByTitle('Master')
			.addChild(nga.menu(providers).title('Providers').template('<a href="#/providers/list"><span class="fa fa-table"></span> Providers</a>'))
		}
		if(enabledPlugins.indexOf("Coupons") > -1) {
			admin.menu().getChildByTitle('Courses')
			.addChild(nga.menu(coupons).title('Coupons').template('<a href="#/coupons/list"><span class="fa fa-cog"></span> Coupons</a>'))
		} 
		if(enabledPlugins.indexOf("CourseWishlist") > -1) {
			admin.menu().getChildByTitle('Courses')
			.addChild(nga.menu(course_favourites).title('Course Wishlists').template('<a  href="#/course_favourites/list"><span class="fa fa-eye"></span> Course Wishlists</a>'))
		} 
		if(enabledPlugins.indexOf("RatingAndReview") > -1) {
			admin.menu().getChildByTitle('Courses')
			.addChild(nga.menu(course_user_feedbacks).title('Course Feedback').template('<a href="#/course_user_feedbacks/list"><span class="fa fa-comment-og"></span> Course Feedback</a>'))
		}	
		if(enabledPlugins.indexOf("SudoPay") > -1) {
			admin.menu().getChildByTitle('Payments & Logs')
			.addChild(nga.menu(sudopay_payment_gateways).title('SudoPay Gateways').template('<a href="#/sudopay_payment_gateways/list"><span class="fa fa-inr"></span> SudoPay Gateways</a>'))
		}
		if(enabledPlugins.indexOf("CourseCheckout") > -1)  {
			admin.menu().getChildByTitle('Payments & Logs')
			.addChild(nga.menu(transactions).title('Transactions').icon('<span class="fa fa-money"></span>'))
		}
		if(enabledPlugins.indexOf("CourseCheckout") > -1 || enabledPlugins.indexOf("Subscriptions") > -1)  {
			admin.menu().getChildByTitle('Payments & Logs')
			.addChild(nga.menu(ipn_logs).title('IPN Logs').icon('<span class="fa fa-inr"></span>'))
		}
		//disable Payments & Logs parent menu if both subscriptions and CourseCheckout plugin disabled
		if(enabledPlugins.indexOf("CourseCheckout") === -1 && enabledPlugins.indexOf("Subscriptions") === -1)  {
			admin.menu().getChildByTitle('Payments & Logs')
				.title('')
				.template('')
				.icon('');
		}
	}
    // customize header
    var customHeaderTemplate = '<div class="navbar-header">' +
        '<button type="button" class="navbar-toggle" ng-click="isCollapsed = !isCollapsed">' +
        '<span class="icon-bar"></span>' +
        '<span class="icon-bar"></span>' +
        '<span class="icon-bar"></span>' +
        '</button>' +
        '<a class="navbar-brand" href="#/dashboard" ng-click="appController.displayHome()">Admin Panel</a>' +
        '</div>' + '<custom-header></custom-header>'; //<custom-header></custom-header> this is custom directive				
    admin.header(customHeaderTemplate);

    // customize dashboard
    var dashboardTpl = '<div class="row list-header"><div class="col-lg-12"><div class="page-header">' +
        '<h4><span>Dashboard</span></h4></div></div></div>' +
        '<dashboard-summary></dashboard-summary>';
    admin.dashboard(nga.dashboard()
        .template(dashboardTpl)
    );
	nga.configure(admin);
}]);