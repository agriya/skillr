/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {

}(angular.module('ace.withdrawal', [
    'ui.router',
    'ngResource'
])));

(function(module) {
    module.directive('moneyTransfer', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here

        };
        return {
            restrict: 'E',
            templateUrl: 'src/app/plugins/Withdrawal/moneyTransfer.tpl.html',
            link: linker,
            controller: 'moneyTransferController as model',
            bindToController: true,
            transclude: true,
            scope: {

            }
        };
    });

    module.controller('moneyTransferController', function($state, $scope, MoneyTransfer, UserCashWithdrawals, $rootScope, flash, User, $filter, TokenServiceData) {
        var model = this;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Withdrawals");
        model.moneyTransferList = [];
        $scope.withdrawals = [];
        $scope.withdrawals.minimum_withdraw_amount = $rootScope.settings['withdrawals.minimum_withdraw_amount'];
        $scope.withdrawals.maximum_withdraw_amount = $rootScope.settings['withdrawals.maximum_withdraw_amount'];
        $scope.infoMessage = '';
        $scope.user_available_balance = '';
        model.userCashWithdrawalsList = [];
        model.moneyTransferFormSubmit = moneyTransferFormSubmit;
        model.moneyTransfer = new UserCashWithdrawals();
        var user_id = $rootScope.auth ? parseInt($rootScope.auth.id) : '';

        User.getUser({
                id: user_id,
                field: 'available_balance'
            }).$promise
            .then(function(response) {
                if (angular.isDefined(response.data[0])) {
                    $scope.user_available_balance = response.data[0].available_balance;
                }
            });

        function getMoneyTransferList() {
            MoneyTransfer.get().$promise
                .then(function(response) {
                    model.moneyTransferList = response.data;
                });
        }

        var params = {};
        params.limit = 4;

        function UserCashWithdrawalsget() {
            params.page = $scope.currentPage;
            UserCashWithdrawals.get(params).$promise
                .then(function(response) {
                    model.userCashWithdrawalsList = response.data;
                    $scope._metadata = response._metadata;
                });
        }


        function moneyTransferFormSubmit() {
            model.moneyTransfer.user_id = user_id;
            model.moneyTransfer.withdrawal_status_id = 1; // 1 denotes 'pending' 
            model.moneyTransfer.$save()
                .then(function(response) {
                    if (angular.isDefined(response.error)) {
                        if (response.error.code === 2) {
                            errorMessage = $filter("translate")("Your previous withdraw request is in pending status. So you can't request now.");
                        } else if (response.error.code === 1) {
                            errorMessage = $filter("translate")("You Dont have sufficient amount in your wallet.");
                        }
                        flash.set(errorMessage, "error", false);
                    } else if (angular.isDefined(response.id !== '' && response.id !== "null")) {
                        successMessage = $filter("translate")("Your request submitted successfully.");
                        flash.set(successMessage, "success", false);
                        UserCashWithdrawalsget();
                        getMoneyTransferList();
                    }
                    model.moneyTransfer = new UserCashWithdrawals();
                })
                .catch(function(error) {

                })
                .finally();
        }
        $scope.index = function() {
            $scope.currentPage = ($scope.currentPage !== undefined) ? parseInt($scope.currentPage) : 1;
            UserCashWithdrawalsget();
            getMoneyTransferList();
        };
        $scope.index();
        $scope.paginate = function(pageno) {
            $scope.currentPage = parseInt($scope.currentPage);
            $scope.index();
        };

    });
})(angular.module('ace.withdrawal'));

(function(module) {
    module.directive('moneyTransferAdd', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'E',
            templateUrl: 'src/app/plugins/Withdrawal/moneyTransferAdd.tpl.html',
            link: linker,
            controller: 'moneyTransferAddController as model',
            bindToController: true,
            transclude: true,
            scope: {}
        };
    });

    module.controller('moneyTransferAddController', function($scope, $state, MoneyTransfer, $rootScope, MoneyTransferAccountDelete, flash, $filter, TokenServiceData) {
        var model = this;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Money Transfer Add");
        model.moneyTransferAddFormSubmit = moneyTransferAddFormSubmit;
        model.moneyTransferAccountList = [];
        model.moneyTransferAdd = new MoneyTransfer();
        var user_id = $rootScope.auth ? $rootScope.auth.id : '';
        model.deleteMoneyTransferAccount = deleteMoneyTransferAccount;

        var params = {};
        params.limit = "all";

        function getMoneyTransfer() {
            params.page = $scope.currentPage;
            MoneyTransfer.get(params).$promise
                .then(function(response) {
                    model.moneyTransferAccountList = response.data;
                    $scope._metadata = response._metadata;
                });
        }

        function moneyTransferAddFormSubmit() {
            model.moneyTransferAdd.user_id = user_id;
            model.moneyTransferAdd.$save()
                .then(function(response) {
                    flashMessage = $filter("translate")("Money transfer account added successfully.");
                    flash.set(flashMessage, "success", false);
                    getMoneyTransfer();
                })
                .catch(function(error) {

                })
                .finally();
        }

        function deleteMoneyTransferAccount(id) {
            MoneyTransferAccountDelete.deleteMoneyTransferAccount({
                id: id
            }, function(response) {
                if (response.error.code === 0) {
                    flashMessage = $filter("translate")("Money transfer account deleted successfully.");
                    flash.set(flashMessage, "success", false);
                } else if (response.error.code === 1) {
                    flashMessage = $filter("translate")("One of your withdrawal request is in pending status,So you can't delete this now.");
                    flash.set(flashMessage, "error", false);
                }

                getMoneyTransfer();
            });

        }

        $scope.index = function() {
            $scope.currentPage = ($scope.currentPage !== undefined) ? parseInt($scope.currentPage) : 1;
            getMoneyTransfer();
        };

        $scope.index();
        $scope.paginate = function(pageno) {
            $scope.currentPage = parseInt($scope.currentPage);
            $scope.index();
        };

    });
})(angular.module('ace.withdrawal'));

(function(module) {
    module.factory('MoneyTransfer', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/money_transfer_accounts.json', {
                id: '@id'
            }
        );
    });
    module.factory('UserCashWithdrawals', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/user_cash_withdrawals.json', {
                id: '@id'
            }
        );
    });
    module.factory('MoneyTransferAccountDelete', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/money_transfer_accounts/:id.json', {
                id: '@id'
            }, {
                'deleteMoneyTransferAccount': {
                    method: 'delete'
                }
            }
        );
    });
})(angular.module('ace.withdrawal'));
