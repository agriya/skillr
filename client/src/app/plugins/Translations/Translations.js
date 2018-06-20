/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {


}(angular.module('ace.translations', [
    'ngResource',
	'pascalprecht.translate',
	'tmh.dynamicLocale',
	'ngSanitize',
	'ngCookies'
])));

(function(module) {
	
	module.config(function(tmhDynamicLocaleProvider) {
        tmhDynamicLocaleProvider.localeLocationPattern('src/app/plugins/Translations/angular-i18n/angular-locale_{{locale}}.js');
    });
	module.service('languageList', function($sce, $rootScope, $q, GENERAL_CONFIG) {
        promise = $.get(GENERAL_CONFIG.api_url + 'api/v1/settings/site_languages.json?token=' + token, {
            limit: 'all'
        }, function(response) {});
        return {
            promise: promise
        };
    });
    module.service('LocaleService', function($translate, $rootScope, tmhDynamicLocale, GENERAL_CONFIG, languageList) {
        'use strict';
        var localesObj;
        var localesObj1 = {};
        localesObj1.locales = {};
        localesObj1.preferredLocale = {};
        var _LOCALES_DISPLAY_NAMES = [];
        var _LOCALES;

        var promiseSettings = languageList.promise;
        promiseSettings.then(function(response) {
            $.each(response.site_languages, function(i, data) {
                localesObj1.locales[data.iso2] = data.name;
            });
            localesObj1.preferredLocale = response.preferredLocale[0].iso2;
            localesObj = localesObj1.locales;
            // locales and locales display names
            _LOCALES = Object.keys(localesObj);
            if (!_LOCALES || _LOCALES.length === 0) {
                console.error('There are no _LOCALES provided');
            }
            _LOCALES.forEach(function(locale) {
                _LOCALES_DISPLAY_NAMES.push(localesObj[locale]);
            });
        });
        // STORING CURRENT LOCALE
        // var currentLocale = $translate.proposedLanguage(); // because of async loading - its some times returns browser language
		var currentLocale = $translate.use() || $translate.preferredLanguage(); // because of async loading
        $.cookie('currentLocale', currentLocale, {
            path: '/'
        });
        // METHODS
        var checkLocaleIsValid = function(locale) {
            return _LOCALES.indexOf(locale) !== -1;
        };

        var setLocale = function(locale) {
            if (!checkLocaleIsValid(locale)) {
                console.error('Locale name "' + locale + '" is invalid');
                return;
            }
            currentLocale = locale; // updating current locale
            $.cookie('currentLocale', currentLocale, {
                path: '/'
            });
            // asking angular-translate to load and apply proper translations
            $translate.use(locale);
        };

        // EVENTS
        // on successful applying translations by angular-translate
        $rootScope.$on('$translateChangeSuccess', function(event, data) {
            document.documentElement.setAttribute('lang', data.language); // sets "lang" attribute to html
			$rootScope.$emit('changeLanguage', {
				currentLocale: data.language,
			});
            // asking angular-dynamic-locale to load and apply proper AngularJS $locale setting
            tmhDynamicLocale.set(data.language.toLowerCase().replace(/_/g, '-'));
        });

        return {
            getLocaleDisplayName: function() {
                return localesObj[currentLocale];
            },
            setLocaleByDisplayName: function(localeDisplayName) {
                setLocale(
                    _LOCALES[
                        _LOCALES_DISPLAY_NAMES.indexOf(localeDisplayName) // get locale index
                    ]
                );
            },
            getLocalesDisplayNames: function() {
                return _LOCALES_DISPLAY_NAMES;
            }
        };
    });
    module.directive('ngTranslateLanguageSelect', function(LocaleService, languageList) {
        'use strict';
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'src/app/plugins/Translations/languageTranslate.tpl.html',
            controller: function($scope, $rootScope, $timeout, languageList, tmhDynamicLocale, $translate) {				
				var currentLanguage = $translate.use() || $translate.preferredLanguage();
				tmhDynamicLocale.set(currentLanguage);
                var promiseSettings = languageList.promise;
                promiseSettings.then(function(response) {
                    $scope.currentLocaleDisplayName = LocaleService.getLocaleDisplayName();
                    $scope.localesDisplayNames = LocaleService.getLocalesDisplayNames();
                    $scope.visible = $scope.localesDisplayNames &&
                        $scope.localesDisplayNames.length > 1;

                });

                $scope.changeLanguage = function(locale) {					
                    LocaleService.setLocaleByDisplayName(locale);
                };
            }
        };
    });
}(angular.module("ace.translations")));