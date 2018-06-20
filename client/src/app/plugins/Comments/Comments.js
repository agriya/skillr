/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {
    module.config(function() {

    });

}(angular.module('ace.comments', [
    'ui.router',
    'ngResource',
    'OcLazyLoad',
    'ngDisqus'
])));

(function (angular, window) {
  'use strict';

  var disqusModule = angular.module('ngDisqus', [ ]);

  /**
   * $disqus provider.
   */
  disqusModule.provider('$disqus', function() {
    var TYPE_EMBED = 'embed.js'; // general disqus embed script
    var TYPE_COUNT = 'count.js'; // used for count

    // Placeholder for the disqus shortname
    var shortname;

    /**
     * @return {Element} dom element for script adding
     */
    function getScriptContainer() {
      return (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]);
    }

    /**
     * @return {String} disqus shortname
     */
    function getShortname() {
      return shortname || window.disqus_shortname;
    }

    /**
     * @param {String} shortname disqus shortname
     * @param {String} file file name to add.
     * @return {String} disqus embed src with embedded shortname
     */
    function getScriptSrc(shortname, file) {
      return '//' + shortname + '.disqus.com/' + file;
    }

    /**
     * Builds the script tag
     *
     * @param {String} src script source
     * @return {Element} script element
     */
    function buildScriptTag(src) {
      var script = document.createElement('script');

      // Configure the script tag
      script.type  = 'text/javascript';
      script.async = true;
      script.src   = src;

      return script;
    }

    /**
     * Searches the given element for defined script tag
     * if its already there then return true. Otherwise return false
     *
     * @param {Element} element element to search within
     * @param {String} scriptSrc script src
     * @return {Boolean} true if its there, false if its not
     */
    function hasScriptTagInPlace(container, scriptSrc) {
      var scripts   = container.getElementsByTagName('script'),
      script, i;

      for (i = 0; i < scripts.length; i += 1) {
        script = scripts[i];

        // Check if the name contains the given values
        // We need to check with indexOf because browsers replace // with their protocol
        if (~script.src.indexOf(scriptSrc)) {
          return true;
        }
      }
      return false;
    }

    /**
     * Writes disqus globals to window object.
     * Needed for the first load. Otherwise the disqus wouldn't know what thread comments to load.
     *
     * @param {String} id disqus identifier
     * @param {String} url disqus url
     * @param {String} shortname disqus shortname
     */
    function setGlobals(id, url, shortname) {
      window.disqus_identifier = id;
      window.disqus_url        = url;
      window.disqus_shortname  = shortname;
    }

    /**
     * Refreshes the count from DISQUSWIDGETS.
     */
    function getCount() {
      var widgets = window.DISQUSWIDGETS;
      if (widgets && angular.isFunction(widgets.getCount)) {
        widgets.getCount();
      }
    }

    /**
     * Trigger the reset comment call
     * @param  {String} $location location service
     * @param  {String} id Thread id
     */
    function resetCommit($location, id) {
      window.DISQUS.reset({
        reload: true,
        config : function() {
          this.page.identifier = id;
          this.page.url        = $location.absUrl();
        }
      });
    }

    /**
     * Adds disqus script tag to header by its type.
     * If the script tag already exists in header then wont continue.
     *
     * Adds script tags by their type.
     * Currently we are using two types:
     *  1. count.js
     *  2. embed.js
     *
     * @param {String} shortname disqus shortname
     * @param {String} type disqus script tag type
     */
    function addScriptTag(shortname, type) {
      var container = getScriptContainer(),
      scriptSrc = getScriptSrc(shortname, type);

      // If it already has a script tag in place then lets not do anything
      // This might happen if the user changes the page faster than then disqus can load
      if (hasScriptTagInPlace(container, scriptSrc)) {
        return;
      }

      // Build the script tag and append it to container
      container.appendChild(buildScriptTag(scriptSrc));
    }


    /**
     * @param {String} sname shortname
     */
    this.setShortname = function(sname) {
      shortname = sname;
    };

    // Provider constructor
    this.$get = [ '$location', function($location) {

      /**
       * Resets the comment for thread.
       * If disqus was not defined then it will add disqus to script tags.
       * If disqus was initialized earlier then it will just use disqus api to reset it
       *
       * @param  {String} id required thread id
       */
      function commit(id) {
        var shortname = getShortname();

        if (!angular.isDefined(shortname)) {
          throw new Error('No disqus shortname defined');
        } else if (!angular.isDefined(id)) {
          throw new Error('No disqus thread id defined');
        } else if (angular.isDefined(window.DISQUS)) {
          resetCommit($location, id);
        } else {
          setGlobals(id, $location.absUrl(), shortname);
          addScriptTag(shortname, TYPE_EMBED);
        }
      }

      /**
       * Loads the comment script tag and initiates the comments.
       * Sets the globals according to the current page.
       *
       * If the embed disqus is not added to page then adds that.
       *
       * @param {String} id thread id
       */
      function loadCount(id) {
        setGlobals(id, $location.absUrl(), shortname);
        addScriptTag(getShortname(), TYPE_EMBED);
        addScriptTag(getShortname(), TYPE_COUNT);
        getCount();
      }

      // Expose public api
      return {
        commit       : commit,
        getShortname : getShortname,
        loadCount    : loadCount
      };
    }];
  });

  /**
   * Disqus thread comment directive.
   * Used to display the comments block for a thread.
   */
  disqusModule.directive('disqus', [ '$disqus', function($disqus) {

    return {
      restrict : 'AC',
      replace  : true,
      scope    : {
        id : '=disqus',
      },
      template : '<div id="disqus_thread"></div>',
      link: function link(scope) {
        scope.$watch('id', function(id) {
          if (angular.isDefined(id)) {
            $disqus.commit(id);
          }
        });
      }
    };
  }]);

  /**
   * Disqus comment count directive.
   * Just wraps `disqus-identifier` to load the disqus comments count script tag on page
   */
  disqusModule.directive('disqusIdentifier', [ '$disqus', function($disqus) {
    return {
      restrict : 'A',
      link     : function(scope, elem, attr) {
        $disqus.loadCount(attr.disqusIdentifier);
      }
    };
  }]);

})(angular, this);

(function(module) {
    module.directive('dirDisqus', ['$window', function ($window) {
        return {
            restrict: 'E',
            scope: {
                config: '='
            },
            template: '<div id="disqus_thread"></div><a href="http://disqus.com" class="dsq-brlink"></a>',
            link: function (scope) {

                scope.$watch('config', configChanged, true);

                function configChanged() {

                    // Ensure that the disqus_identifier and disqus_url are both set, otherwise we will run in to identifier conflicts when using URLs with "#" in them
                    // see http://help.disqus.com/customer/portal/articles/662547-why-are-the-same-comments-showing-up-on-multiple-pages-
					if(scope.config !== undefined){
						if (!scope.config.disqus_shortname ||
							!scope.config.disqus_identifier ||
							!scope.config.disqus_url) {
							return;
						}

                    $window.disqus_shortname = scope.config.disqus_shortname;
                    $window.disqus_identifier = scope.config.disqus_identifier;					
                    $window.disqus_url = scope.config.disqus_url;
                    $window.disqus_title = scope.config.disqus_title;
                    $window.disqus_category_id = scope.config.disqus_category_id;
                    $window.disqus_disable_mobile = scope.config.disqus_disable_mobile;
                    $window.disqus_config = function () {
                        this.language = scope.config.disqus_config_language;
                        this.page.remote_auth_s3 = scope.config.disqus_remote_auth_s3;
                        this.page.api_key = scope.config.disqus_api_key;
                        if (scope.config.disqus_on_ready) {
                            this.callbacks.onReady = [function () {
                                scope.config.disqus_on_ready();
                            }];
                        }
                    };

                    // Get the remote Disqus script and insert it into the DOM, but only if it not already loaded (as that will cause warnings)
                    if (!$window.DISQUS) {
                        var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
                        dsq.src = '//' + scope.config.disqus_shortname + '.disqus.com/embed.js';
                        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
                    } else {
                        $window.DISQUS.reset({
                            reload: true,
                            config: function () {
                                this.page.identifier = scope.config.disqus_identifier;
                                this.page.url = scope.config.disqus_url;
                                this.page.title = scope.config.disqus_title;
                                this.language = scope.config.disqus_config_language;
                                this.page.remote_auth_s3 = scope.config.disqus_remote_auth_s3;
                                this.page.api_key = scope.config.disqus_api_key;
                            }
                        });
                    }
                }
				}
            }
        };
    }]);

})(angular.module('ace.comments'));


(function(module) {
    module.directive('facebookComments', function($state, $rootScope, TokenService, $location, $timeout, $compile) {
        var linker = function(scope, element, attrs) {
		var currentURL = $location.absUrl();
		newUrl = '<div class="fb-comments" page-href=\"{{currentURL}}\" data-width="500" data-numposts="5"></div>';		
		compiled = $compile(newUrl)(scope);
		element.append(compiled);       

        };
        return {
            restrict: 'E',           
            link: linker,
            controller: 'FacebookCommentsController as model',
            bindToController: true,
            scope: {
			}
        };
    });

    module.controller('FacebookCommentsController', function($state, $scope, $rootScope, TokenService, $location, $timeout) {
			
		var model = this;
		
    });
	module.directive('fbComments', function($window, GENERAL_CONFIG, $rootScope) {
    function createHTML(href, numposts, width, colorscheme) {
        return '<div class="fb-comments" ' +
            'data-href="' + href + '" ' +
            'data-numposts="' + numposts + '" ' +
            'data-width="' + width + '" ' +
            'data-colorsheme="' + colorscheme + '">' +
            '</div>';
    }
    return {
        restrict: 'C',
			link: function(scope, element, attributes) {					  
				if (typeof FB === "undefined" || FB === null) {
				// Load Facebook SDK if not already loaded
				$.getScript('//connect.facebook.net/en_US/sdk.js', function () {
					var api_key = $rootScope.settings['facebook.comments.api_key'];
					$window.FB.init({
						appId: api_key,
						xfbml: true,
						version: 'v2.5'
					});					 
				});

				} 
				attributes.$observe('pageHref', function(newValue) {
					var href = newValue;
					var numposts = attributes.numposts || 5;
					var width = attributes.width || '550px';
					var colorscheme = attributes.colorscheme || 'light';
					element.html(createHTML(href, numposts, width, colorscheme));
					if (typeof FB !== "undefined" && FB !== null) {
						FB.XFBML.parse(element[0]);
					} else {
						void 0;
					}
				});
			}
    	};
	})

})(angular.module('ace.comments'));