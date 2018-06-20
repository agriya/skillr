(function(module) {
    module.controller('AddCourseController', ['$window', 'Course', '$rootScope', '$scope', '$http', '$location', '$filter', 'TokenServiceData', 'flash', function($window, Course, $rootScope, $scope, $http, $location, $filter, TokenServiceData, flash) {
        var model = this;
        $rootScope.pageTitle = $rootScope.settings['site.name'] + " | " + $filter("translate")("Add Course");
        model.course = new Course();
        model.save = save;
        var newCourseId = '';

        function save() {
            //model.course.course_type_id = 1;
            $scope.disableButton = true;
            model.course.category_id = model.course.parent_category_id;
            model.course.$save()
                .then(function(response) {
                    newCourseId = response.id;
                    if (angular.isDefined(newCourseId) && newCourseId !== 'null') {
                        $rootScope.$emit('checkIsTeacher', {});
                        $window.location = '#!/manage-course/edit-getting-started/' + newCourseId;
                    } else {
                        error_msg = $filter("translate")("Course couldn\'t be add. Please try again.");
                        flash.set(error_msg, 'error', false);
                    }
                    $scope.disableButton = false;
                })
                .catch(function(error) {})
                .finally();
        }
    }]);
}(angular.module("ace.courses")));
