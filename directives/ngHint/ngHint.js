slonComponents.directive('ngHint', function($timeout, $compile) {
    var lastZIndex = 1;

    return {
        restrict: 'A',
        scope: {
            ngHint : '@',
            ngHintShowCondition: '=',
            ngHintSettings: '='
        },
        link: function ($scope, element, attr) {
            $scope.ngHintSettings = $scope.ngHintSettings || {};
            $scope.ngHintSettings.position = $scope.ngHintSettings.position || 'north';
            var noCondition = false;
            $scope.zIndex = lastZIndex;
            if (!attr.ngHintShowCondition) noCondition = true;
            Object.defineProperties($scope, {
                'condition' : {
                    get : function(){
                        return noCondition || $scope.ngHintShowCondition;
                    },
                    enumerable : true
                }
            })

            var template = angular.element('<span class="hint {{ngHintSettings.type}}" ' +
                'ng-show="ngHint && userOnElement && condition" ng-bind-html="ngHint" ng-style="{\'zIndex\' : zIndex}"></span>');
            var inputIsFocused = false;
            $compile(template)($scope);
            element.append(template);
            
            $timeout(function () {
                element.css({
                    position: 'relative'
                });

                switch ($scope.ngHintSettings.position) {
                    case 'west':
                        element.find('.hint').addClass('west');
                        break;

                    case 'south':
                        element.find('.hint').addClass('south');
                        break;

                    default :
                        element.find('.hint').css('top', element.height() + 55);
                        break;
                }

                if ($scope.ngHintSettings.text) {
                    element.find('.hint').css('text-align', settings.text)
                }
            });

            function enterEl(){
                $scope.userOnElement = true;
                lastZIndex++;
                $scope.zIndex = lastZIndex;
                $scope.$apply();
            }

            function leaveEl(){
                if (!inputIsFocused) {
                    $scope.userOnElement = false;
                    $scope.$apply();
                }
            }

            function onFocus(){
                inputIsFocused = true;
                enterEl();
            }

            function onBlur(){
                inputIsFocused = false;
                $scope.userOnElement = false;
                $scope.$apply();
            }

            element.on('mouseenter', enterEl);
            element.on('mouseleave', leaveEl);

            var input = element.find('[ng-hint-input]');
            input.on('focus', onFocus);
            input.on('blur', onBlur);

            $scope.$on('$destroy', function(){
                element.off('mouseenter', enterEl);
                element.off('mouseleave', leaveEl);
                input.off('focus', onFocus);
                input.off('blur', onBlur);
            })
        }
    }
});
