/**
 * ace - v0.0.1 - 2016-04-13
 *
 * Copyright (c) 2016 Agriya
 */
(function(module) {

}(angular.module('ace.coupons', [
    'ui.router',
    'ngResource'

])));

(function(module) {
    module.factory('Coupons', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/coupons.json', {
                id: '@id'
            }
        );
    });
    module.factory('CouponDetail', function($resource, GENERAL_CONFIG) {
        return $resource(
            GENERAL_CONFIG.api_url + 'api/v1/coupons/:id.json', {
                id: '@id'
            }, {
                'update': {
                    method: 'PUT'
                }
            }
        );
    });
})(angular.module("ace.coupons"));

(function(module) {
    module.directive('courseCoupon', function() {
        var linker = function(scope, element, attrs) {
            // do DOM Manipulation here
        };
        return {
            restrict: 'A',
            templateUrl: 'src/app/plugins/Coupons/courseCouponButton.tpl.html',
            link: linker,
            controller: 'CourseCouponButtonController as model',
            bindToController: true,
            scope: {
                courseId: '@courseId'
            }
        };
    });
    module.controller('CourseCouponButtonController', function($scope) {
        var model = this;
        $scope.courseID = model.courseId;
    });
    module.controller('CouponController', function($scope, $state, flash, $filter, Coupons, CouponDetail, $rootScope, TokenServiceData) {
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Manage Coupons");
        var model = this;
        model.loading = true;
        model.course = [];
        model.existingCoupons = [];
        model.updateCoupons = {};
        model.coupon = new Coupons();
        model.couponSave = couponSave;
        model.getExistingCoupons = getExistingCoupons;
        model.changeCouponStatus = changeCouponStatus;

        function couponSave() {
            model.coupon.teacher_user_id = $rootScope.auth.id;
            model.coupon.course_id = $state.params.id;
            model.coupon.coupon_code = '';
            model.coupon.$save()
                .then(function(response) {
                    if (response.id !== null && response.id !== '') {
                        success_msg = $filter("translate")("Coupon created succsessfully");
                        flash.set(success_msg, "success", false);
                        getExistingCoupons();
                    }
                })
                .catch(function(error) {

                })
                .finally();

        }
        getExistingCoupons();

        function getExistingCoupons() {
            if (angular.isDefined($state.params.id) && $state.params.id !== '') {
                Coupons.get({
                        course_id: $state.params.id
                    }).$promise
                    .then(function(response) {
                        model.existingCoupons = response.data;
                        model.loading = false;
                    });
            } else {
                $scope.$emit('updateParent', {
                    isOn404: true,
                    errorNo: 404
                });
            }
        }

        function changeCouponStatus(status, coupon_id) {
            model.updateCoupons.id = coupon_id;
            model.updateCoupons.is_active = status;
            CouponDetail.update(model.updateCoupons, function(response) {
                if (response.error.code !== 1) {
                    flash.set("Updated Successfully", 'success', false);
                    getExistingCoupons();
                }
            });
        }
    });

}(angular.module("ace.coupons")));
