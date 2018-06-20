/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {

}(angular.module('ace.subscriptions', [
    'ngResource',
    'ace.users'
])));

(function(module) {

    module.controller('MeSubscriptionController', ['SubscriptionsPlans', 'MeSubscriptions', 'UserSubscriptionsDetail', 'UpdateUserSubscriptions', '$rootScope', '$scope', '$location', '$state', '$filter', 'TokenServiceData', 'flash', '$interval', function(SubscriptionsPlans, MeSubscriptions, UserSubscriptionsDetail, UpdateUserSubscriptions, $rootScope, $scope, $location, $state, $filter, TokenServiceData, flash, $interval) {
        var model = this;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("My Subscriptions");
        model.Subscriptions = [];
        model.mySubscriptions = [];
        model.UserSubscriptions = [];
        model.UpdateSub = {};
        params = {};
        $scope.subscription_count_arr = [];
        $scope.subscription_count = 0;
        var error_code = parseInt($state.params.error_code);
        var error_message = $state.params.error_message;
        var return_subscription_id = $state.params.subscription_id;
        var current_plan_id = '';

        function init() {
            var current_url = $location.absUrl();
            if (current_url.indexOf('auth') > -1) {
                window.location.href = "/#!/me/subscriptions" + "?error_code=" + error_code + "&error_message=" + error_message + "&subscription_id=" + return_subscription_id;
                return;
            }
        }
        init();
        MeSubscriptions.get().$promise.then(function(response) {
            model.mySubscriptions = response.data;
            // my subscription count
            angular.forEach(model.mySubscriptions, function(key, value) {
                if (key.is_current_plan === 'true') {
                    current_plan_id = key.id;
                    $scope.subscription_count_arr.push({
                        name: value.name,
                        id: value.id
                    });
                }
            });

            $scope.subscription_count = $scope.subscription_count_arr.length;

            //error handling on subscription payment success 
            if (error_code === 0) {
                if (parseInt(current_plan_id) === parseInt(return_subscription_id)) {
                    $scope.stopReload();
                    msg = $filter("translate")("Your subscription successfully completed.");
                    flash.set(msg, "success", false);
                } else {
                    if (angular.isDefined(return_subscription_id)) {
                        msg = $filter("translate")("Your subscription successfully completed and waiting for payment gateway's response.");
                        flash.set(msg, "success", false);
                        $scope.autoReload();
                    }
                }
            } else {
                if (angular.isDefined(error_code) && angular.isDefined(error_message) && error_message !== '' && error_message !== undefined) {
                    flash.set(error_message, 'error', false);
                }
            }

        });
        //total_subscriptions
        SubscriptionsPlans.get().$promise.then(function(response) {
            model.Subscriptions = response.data;
        });
        //alert before activate new plan	
        $scope.Subscribe = function(subscription_count, plan_id, e) {
            e.preventDefault();
            if (subscription_count > 0) {
                confirm_msg = $filter("translate")("When making new subscription, previous active plan will be inactivated and we never refund your current plan. Are you sure to continue?");
                if (confirm(confirm_msg)) {
                    $state.go('subscribe', {
                        id: plan_id
                    });
                }
            } else {
                $state.go('subscribe', {
                    id: plan_id
                });
            }
        };

        function getUserSubscription(element) {
            params.page = $scope.currentPage;
            UserSubscriptionsDetail.get({
                id: $rootScope.auth.id,
                filter: params,
                limit: 15
            }).$promise.then(function(response) {
                model.UserSubscriptions = response.data;
                $scope._metadata = response._metadata;
                if (element !== null && angular.isDefined(element)) {
                    $('html, body').animate({
                        scrollTop: $(element).offset().top
                    }, 1500, 'swing', false);
                }
            });
        }
        //unsubscribe plan
        $scope.Update = function(id, subscribeplan, e) {
            e.preventDefault();
            confirm_msg = $filter("translate")("We never refund your subscribed amount and you can access courses until your subscription expiry date. Are you sure want to unsubscribe this plan?");
            if (confirm(confirm_msg)) {
                model.UpdateSub.id = id;
                UpdateUserSubscriptions.update(model.UpdateSub, function(response) {
                    if (response.error.code === 0) {
                        subscribeplan.is_current_plan = 'false';
                        $scope.subscription_count = 0;
                        getUserSubscription(null);
                        success_msg = $filter("translate")("Successfully Unsubscribed.");
                        flash.set(success_msg, "success", false);
                        $location.url($location.path());
                    } else {
                        error_msg = $filter("translate")("Failed to Unsubscribe");
                        flash.set(error_msg, "error", false);
                    }
                });
            }
        };
        $scope.index = function(element) {
            $scope.currentPage = ($scope.currentPage !== undefined) ? parseInt($scope.currentPage) : 1;
            getUserSubscription(element);
        };
        $scope.index(null);
        $scope.paginate = function(element) {
            $scope.currentPage = parseInt($scope.currentPage);
            $scope.index(element);
        };
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
    }]);
}(angular.module("ace.subscriptions")));

(function(module) {

    module.controller('subscribePaymentController', ['$scope', 'getGateways', '$sce', 'Countries', 'subscribePayNow', 'ViewCourse', '$state', '$window', '$location', 'GetSubscriptionDetail', 'SubscriptionsPlans', 'flash', '$filter', 'TokenServiceData', '$rootScope', function($scope, getGateways, $sce, Countries, subscribePayNow, ViewCourse, $state, $window, $location, GetSubscriptionDetail, SubscriptionsPlans, flash, $filter, TokenServiceData, $rootScope) {
        var model = this;
        model.loading = true;
        $scope.gatewayError = '';
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Subscription Payment");
        model.subscriptions = [];
        model.subscriptions_id = [];
        model.subscribeplan = {};
        model.getSubscribePlan = getSubscribePlan;
        model.subscriptions.id = $state.params.id ? $state.params.id : '';
        getSubscribePlan();

        function getSubscribePlan() {
            GetSubscriptionDetail.get({
                    id: model.subscriptions.id
                }).$promise
                .then(function(response) {
                    model.subscriptions = response.data[0];
                });
        }
        $scope.paynow_is_disabled = false;
        $scope.validation_msg = '';
        $scope.modalClose = function(e) {
            e.preventDefault();
            $scope.$close();
        };
        SubscriptionsPlans.get().$promise
            .then(function(response) {
                model.subscribeplan = response.data;
                if (model.subscriptions.id === '' || angular.isUndefined(model.subscriptions.id)) {
                    model.subscriptions.id = response.data[0].id;
                }
            });
        getGateways.get({
                gateway_type: 'subscription'
            }).$promise
            .then(function(res) {
                model.loading = false;
                if (angular.isDefined(res.paypal)) {
                    //if paypal enabled
                    if (res.paypal.error.code === 0) {
                        response = res.paypal;
                        if (response.paypal_enabled === true) {
                            $scope.paypal_enabled = true;
                        } else {
                            $scope.paypal_enabled = false;
                        }
                    }
                    if (res.paypal.error.code === 1) {
                        $scope.paypal_enabled = false;
                    }
                }
                if (angular.isDefined(res.sudopay)) {
                    if (res.sudopay.error.code === 1) {
                        if (res.sudopay.error.message !== '') {
                            $scope.gatewayError = $filter("translate")(res.sudopay.error.message);
                        }
                    }
                    //if sudopay enabled
                    if (res.sudopay.error.code === 0) {
                        response = res.sudopay;
                        $scope.gateway_groups = response.gateway_groups;
                        $scope.payment_gateways = response.payment_gateways;
                        $scope.templates = response.templates;
                        $scope.form_fields_tpls = response.form_fields_tpls;
                        $scope.selected_payment_gateway_id = response.selected_payment_gateway_id;
                        $scope.gateway_instructions = response.gateway_instructions;
                        $scope.gateway_settings_options = response.gateway_settings_options;
                        $scope.gateways = response.selected_payment_gateway_id;
                        $scope.form_fields = [];
                        $scope.show_form = [];
                        $scope.countries = [];
                        Countries.get({
                            limit: 'all'
                        }).$promise.then(function(response) {
                            $scope.countries = response.data;

                            angular.forEach($scope.form_fields_tpls, function(key, value) {
                                var str = '';
                                var replaceStr = '';
                                var replacingStr = '';

                                if (value == "credit_card") {
                                    str = key._html5;
                                    replaceStr = '<img alt="[Image: Credit Cards]" src="img/credit-detail.png">';
                                    if (str.indexOf(replaceStr)) {
                                        replacingStr = '<img alt="[Image: Credit Cards]" src="assets/img/credit-detail.png">';
                                        str = str.replace(replaceStr, replacingStr);
                                        key._html5 = str;
                                    }
                                }
                                if (value == "buyer") {
                                    str = key._html5;
                                    replaceStr = '<input name="buyer_country"id="buyer_country" type="text" data-validate="{required:true,messages:{"required":"Required"}}" required  placeholder="ISO2 Country Code" />';
                                    if (str.indexOf(replaceStr)) {
                                        replacingStr = '<select name="buyer_country" id="buyer_country" data-validate="{required:true,messages:{"required":"Required"}}"><option value="">Please Select</option>';
                                        angular.forEach($scope.countries, function(key, value) {
                                            replacingStr = replacingStr + '<option value="' + key.iso2 + '">' + key.name + '</option>';
                                        });
                                        replacingStr = replacingStr + '</select>';
                                        str = str.replace(replaceStr, replacingStr);
                                        key._html5 = str;
                                    }
                                }
                                $scope.form_fields[value] = $sce.trustAsHtml(key._html5);
                                $scope.show_form[value] = false;
                                $scope.reset_forms();
                            });
                        }).finally(function() {
                            setTimeout(function() {
                                xload(false);
                            }, 1000);
                        });
                    }
                }
            });
        $scope.reset_forms = function() {
            angular.forEach($scope.form_fields_tpls, function(key, value) {
                $scope.show_form[value] = false;
            });
            setTimeout(function() {
                $('.tab-pane.ng-scope input').removeAttr("required");
                $('.tab-pane.ng-scope select').removeAttr("required");
                $('.tab-pane.ng-scope textarea').removeAttr("required");
                $('.tab-pane.ng-scope.active input').attr("required", true);
                $('.tab-pane.ng-scope.active select').attr("required", true);
                $('.tab-pane.ng-scope.active textarea').attr("required", true);
                $('.tab-pane.ng-scope .active .radio_buttons input[type="radio"]').removeAttr("required");
            }, 50);
        };
        $scope.paneChanged = function(pane) {
            $scope.reset_forms();
            $scope.defaultselect(pane);
            setTimeout(function() {
                $('.tab-pane.ng-scope input').removeAttr("required");
                $('.tab-pane.ng-scope select').removeAttr("required");
                $('.tab-pane.ng-scope textarea').removeAttr("required");
                $('.tab-pane.ng-scope.active input').attr("required", true);
                $('.tab-pane.ng-scope.active select').attr("required", true);
                $('.tab-pane.ng-scope.active textarea').attr("required", true);
                $('.tab-pane.ng-scope .active .radio_buttons input[type="radio"]').removeAttr("required");

            }, 50);
        };
        $scope.defaultselect = function(pane) {
            var selectedTab, selectedPayment;
            $scope.gateways = [];
            var keepGoing = true;
            angular.forEach($scope.gateway_groups, function(res) {
                if (keepGoing) {
                    if (res.display_name == pane) {
                        selectedTab = res;
                        $scope.selectedTab = res;
                        keepGoing = false;
                    }
                }
            });
            keepGoing = true;
            angular.forEach($scope.payment_gateways, function(res) {
                if (keepGoing) {
                    if (res.group_id == selectedTab.id) {
                        selectedPayment = res;
                        keepGoing = false;
                        $scope.rdoclick(selectedPayment.id, selectedPayment.form_fields);
                    }
                }
            });
            $scope.gateways = "sp_" + selectedPayment.id;
        };
        $scope.rdoclick = function(res, res1) {
            $scope.gateways = "sp_" + res;
            $scope.array = res1.split(',');
            $scope.reset_forms();
            $scope.paynow_is_disabled = false;
            $scope.validation_msg = '';
            angular.forEach($scope.array, function(value) {
                $scope.show_form[value] = true;
            });
        };

        // Here we use normal jquery method to fetch data since we cant able to put ng-model in input fields(since fields are came from json)
        $scope.payNowClick = function() {
            if ($scope.gateways) {
                gateways_id = $scope.gateways.split('_')[1];
            }
            //console.log( $('.tab-pane.active').find('#buyer_email').val());			
            $scope.sudopay_data = {};
            $scope.sudopay_data.buyer_email = $('.tab-pane.active').find('#buyer_email').val();
            $scope.sudopay_data.buyer_address = $('.tab-pane.active').find('#buyer_address').val();
            $scope.sudopay_data.buyer_city = $('.tab-pane.active').find('#buyer_city').val();
            $scope.sudopay_data.buyer_state = $('.tab-pane.active').find('#buyer_state').val();
            $scope.sudopay_data.buyer_country = $('.tab-pane.active').find('#buyer_country').val();
            $scope.sudopay_data.buyer_zip_code = $('.tab-pane.active').find('#buyer_zip_code').val();
            $scope.sudopay_data.buyer_phone = $('.tab-pane.active').find('#buyer_phone').val();
            $scope.sudopay_data.credit_card_number = $('.tab-pane.active').find('#credit_card_number').val();
            $scope.sudopay_data.credit_card_expire = $('.tab-pane.active').find('#credit_card_expire').val();
            $scope.sudopay_data.credit_card_name_on_card = $('.tab-pane.active').find('#credit_card_name_on_card').val();
            $scope.sudopay_data.credit_card_code = $('.tab-pane.active').find('#credit_card_code').val();
            $scope.sudopay_data.payment_note = $('.tab-pane.active').find('#payment_note').val();
            $scope.sudopay_data.gateway_id = gateways_id;
            $scope.sudopay_data.subscription_id = model.subscriptions.id;
            $scope.sudopay_data.sudopay_gateway_id = gateways_id;
            $scope.paynow_is_disabled = true;
            subscribePayNow.paynowpost($scope.sudopay_data, function(response) {
                if (response.error.code === 0) {
                    flashMessage = $filter("translate")("Your subscription payment successfully completed.");
                    flash.set(flashMessage, 'success', false);
                    $state.go('MeSubscription');
                } else if (response.error.code === -4 && response.gateway_callback_url !== '') {
                    window.location.href = response.gateway_callback_url;
                    $scope.paynow_is_disabled = false;
                } else if (response.error.code >= 0) {
                    $scope.validation_msg = response.error.message;
                    $scope.error_id = response.error.code;
                    flashMessage = $filter("translate")("Payment couldn\'t be completed. Please recheck the payment form again.");
                    flash.set(flashMessage, "error", false);
                    $scope.paynow_is_disabled = false;
                } else {
                    $scope.paynow_is_disabled = false;
                }
            });
        };
        //for paypal form
        $scope.payNowPayPalClick = function() {
            $scope.paypal_data = {};
            $scope.paypal_data.paypal_gateway_enabled = true;
            $scope.paypal_data.subscription_id = model.subscriptions.id;
            $scope.paynow_is_disabled = true;
            subscribePayNow.paynowpost($scope.paypal_data, function(response) {
                //getting paypal subscribe button form data and it will be posted automatically
                if (response.error.code === 0) {
                    $scope.form_data = $sce.trustAsHtml(response.form_data);
                }
            });
        };

    }]);
}(angular.module("ace.subscriptions")));

(function(module) {
    module.directive('subscriptionsPlans', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'E',
            templateUrl: 'src/app/plugins/Subscriptions/subscriptionsPlans.tpl.html',
            link: linker,
            controller: 'subscriptionsPlanController as model',
            bindToController: true,
            scope: {}
        };
    });

    module.controller('subscriptionsPlanController', ['$state', 'SubscriptionsPlans', '$scope', '$modal', function($state, SubscriptionsPlans, $scope, $modal) {
        var model = this;
        model.subscriptionsplan = {};
        SubscriptionsPlans.get().$promise
            .then(function(response) {
                model.subscriptionsplan = response;
            });

    }]);
})(angular.module('ace.subscriptions'));

(function(module) {
    module.factory('SubscriptionsPlans', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/subscriptions.json', {}, {});
    }]);
    module.factory('GetSubscriptionDetail', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/subscriptions/:id.json', {}, {});
    }]);
    module.factory('getGateways', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/get_gateways.json', {
                gateway_type: '@gateway_type'
            }
        );
    }]);
    module.factory('subscribePayNow', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/subscriptions/payment.json', {

            }, {
                paynowpost: {
                    method: 'POST'
                }
            }
        );
    }]);
    module.factory('Countries', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/countries.json'
        );
    }]);
    module.factory('MeSubscriptions', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/me/subscriptions.json', {}, {
            'get': {
                method: 'GET'
            }
        });
    }]);
    module.factory('UserSubscriptionsDetail', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/users/:id/user_subscription_logs.json', {}, {
            'get': {
                method: 'GET'
            }
        });
    }]);
    module.factory('UpdateUserSubscriptions', ['$resource', 'GENERAL_CONFIG', function($resource, GENERAL_CONFIG) {
        return $resource(GENERAL_CONFIG.api_url + 'api/v1/user_subscriptions/:id.json', {
            id: '@id'
        }, {
            'update': {
                method: 'PUT'
            }
        });
    }]);
})(angular.module('ace.subscriptions'));
