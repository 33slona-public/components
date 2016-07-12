/**
 * Created by MetaDriver on 22.09.2015.
 */

'use strict';

slonComponents.directive('scrollBreaker', function () {
        return {
            restrict: 'A',
            replace: false,
            transclude: false,
            link: function ($scope, $element, attr) {
                var attrs = attr.scrollBreaker.split(',');
                var gisteresis = 20;

                var topInPx = parseInt(attrs[0]);
                var className = attrs[1] || '';
                var scrollBreakerIsActive = false;
                $scope.scrollBreaker = true;

                function checkScroll() {
                    var scrolled = window.pageYOffset || document.documentElement.scrollTop;
                    if (scrolled > topInPx) {
                        // add class
                        if (!scrollBreakerIsActive) {
                            $element.addClass(className);
                            scrollBreakerIsActive = true;
                            if (attr.scrollBreakerActivation && typeof $scope[attr.scrollBreakerActivation] === 'function'){
                                $scope[attr.scrollBreakerActivation]();
                            }
                        }
                    } else {
                        if (scrolled < topInPx - gisteresis) {
                            // remove class
                            if (scrollBreakerIsActive){
                                $element.removeClass(className);
                                scrollBreakerIsActive = false;
                                if (attr.scrollBreakerDeactivation && typeof $scope[attr.scrollBreakerDeactivation] === 'function'){
                                    $scope[attr.scrollBreakerDeactivation]();
                                }
                            }
                        }
                    }
                    if(!$scope.$$phase) {
                        $scope.$apply();
                    }
                }

                checkScroll();
                $(window).on('scroll', checkScroll);

                $scope.$on('$destroy', function(){
                    $(window).off('scroll', checkScroll);
                })
            }
        };
    })

;

