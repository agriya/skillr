(function(module) {

    module.controller('contactUsController', ['$scope', '$rootScope', 'Contact', '$filter', 'flash', 'TokenServiceData', '$state', function($scope, $rootScope, Contact, $filter, flash, TokenServiceData, $state) {
        model = this;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Contact US");
        model.contactForm = {};
        var successMessage;
        model.contactFormSubmit = contactFormSubmit;
        model.contactForm = new Contact();

        function contactFormSubmit() {
            $scope.disableButton = true;
            model.contactForm.$save()
                .then(function(response) {
                    if (response.id) {
                        successMessage = $filter("translate")("Thank you for contacting us.");
                        flash.set(successMessage, 'success', false);
                        model.contactForm = new Contact();
                    } else {
                        successMessage = $filter("translate")("Please try again later");
                        flash.set(successMessage, 'success', false);
                    }
                    $scope.disableButton = false;
                })
                .catch(function(error) {

                })
                .finally();
        }
    }]);

}(angular.module("ace.contactUs")));
