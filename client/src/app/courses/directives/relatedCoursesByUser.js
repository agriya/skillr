(function(module) {
    module.directive('relatedCoursesByUser', function() {
        var linker = function(scope, element, attrs, controller) {

        };
        return {
            restrict: 'E',
            templateUrl: 'courses/directives/relatedCoursesByUser.tpl.html',
            link: linker,
            controller: 'relatedCoursesByUser as model',
            bindToController: true,
            scope: {
                userId: '@',
                courseId: '@',
                limit: '@'
            }
        };
    });

    module.controller('relatedCoursesByUser', ['UserTeachingCourse', 'ViewCourse', '$scope', '$state', '$modal', '$rootScope', 'AddFavourite', 'DeleteFavouriteByCourseId', function(UserTeachingCourse, ViewCourse, $scope, $state, $modal, $rootScope, AddFavourite, DeleteFavouriteByCourseId) {
        var model = this;
        model.relatedCoursesByUser = [];
        if (angular.isDefined(model.limit)) {
            limit = model.limit;
        }
        courseId = model.courseId;
        userId = model.userId;
        UserTeachingCourse.get({
            id: userId,
            course_id: courseId,
            limit: limit,
            field: 'id,title,slug,user_id,displayname,price,image_hash,is_from_mooc_affiliate,course_image,user_image_hash,course_user_count,course_user_feedback_count,average_rating'
        }).$promise.then(function(response) {
            model.loading = false;
            model.related_courses_by_user_length = response.data.length;
            model.relatedCoursesByUser = response;
        });

    }]);
})(angular.module('ace.courses'));
