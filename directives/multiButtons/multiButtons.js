slonComponents.directive('multiButtons', function($timeout, $compile) {
    return {
        restrict: 'E',
        scope: {
            cssClass: '@',
            checkbox: '=',
            object: '=',
            changeCallback: '&',
            name: '@'
        },
        replace : true,
        templateUrl: 'components/directives/multiButtons/multiButtons.html',
        link: function ($scope) {
            Object.defineProperty($scope,'currentOption',{
                get : function(){
                    return $scope.object.options[$scope.object.value];
                },
                configurable : true
            })
        }
    }
});