/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {



}(angular.module('ace.payout', [
    'ui.router',
    'ngResource',
])));

(function(module) {
    module.directive('payOut', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'A',
            templateUrl: 'src/app/plugins/Payout/payoutButton.tpl.html',
            link: linker,
            controller: 'payoutButtonController as model',
            bindToController: true,
            scope: {
                courseId: '@courseId'
            }
        };
    });
    module.controller('payoutButtonController', function($scope) {
        var model = this;
        $scope.courseID = model.courseId;
    });
    module.controller('payoutController', function($state, PayoutList, PayoutRedirect, $location, $scope, flash, $filter, $rootScope, TokenServiceData, $interval) {
        var model = this;
        model.loading = true;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Manage Payout");
        model.connectToPayment = connectToPayment;
        model.payment = {};
        model.availPayouts = [];
        var error_code = $state.params.error_code;
        var error_message = $state.params.error_message;
        var connected_gateway_id = $state.params.sudopay_gateway_id;
        var current_payout_id = '';

        if (angular.isDefined($state.params.id) && $state.params.id !== '') {
            PayoutList.get().$promise
                .then(function(response) {
                    if (response.data.length > 0) {
                        model.availPayouts = response.data;
                    } else {
                        // flash.set('There is no Active Payment Options to Connect', 'error', false);
                    }
                    angular.forEach(model.availPayouts, function(key, value) {
                        if (key.is_connected === true) {
                            current_payout_id = key.sudopay_gateway_id;
                        }
                    });
                    //error handling on subscription payment success 
                    if (error_code === 0) {
                        if (parseInt(current_payout_id) === parseInt(connected_gateway_id)) {
                            $scope.stopReload();
                            msg = $filter("translate")("Successfully connected to payment gateway site.");
                            flash.set(msg, "success", false);
                        } else {
                            if (angular.isDefined(connected_gateway_id)) {
                                msg = $filter("translate")("Successfully connected to payment gateway site and waiting for payment gateway's response.");
                                flash.set(msg, "success", false);
                                $scope.autoReload();
                            }
                        }
                    } else {
                        if (angular.isDefined(error_code) && angular.isDefined(error_message) && error_message !== '') {
                            flash.set(error_message, 'error', false);
                        }
                    }


                    model.loading = false;
                });
        } else {
            $scope.$emit('updateParent', {
                isOn404: true,
                errorNo: 404
            });
        }

        var course_id = parseInt($state.params.id);

        function connectToPayment(sudopayid, event) {
            event.preventDefault();
            model.payment.gateway_id = sudopayid;
            model.payment.course_id = course_id;
            PayoutRedirect.getRedirectUri(model.payment, function(response) {
                if (response.error.code === 0) {
                    redirctUri = response.gateways;
                    redirctUri = redirctUri.gateway_callback_url;
                    window.location.href = redirctUri;
                } else {
                    flash.set(response.error.message, 'error', false);
                }
            });
        }
        var autoRefresh;
        $scope.autoReload = function() {
            autoRefresh = $interval(function() {
                $state.reload();
            }, 20000);
        };
        $scope.stopReload = function() {
            if (angular.isDefined(autoRefresh)) {
                $interval.cancel(autoRefresh);
                autoRefresh = undefined;
            }
        };
        $scope.$on('$destroy', function() {
            $scope.stopReload();
        });

    });
})(angular.module('ace.payout'));

(function(module) {

    module.factory('PayoutList', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/payouts.json'
        );
    });
    module.factory('PayoutRedirect', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/payouts_connect.json', {
                id: '@id'
            }, {
                'getRedirectUri': {
                    method: 'POST'
                }
            }
        );
    });
})(angular.module("ace.payout"));
