slonComponents.directive('isViewed', function($timeout){
    return {
        restrict : 'A',
        link : function($scope, element, attr){
            var body = $('body'),
                viewingNow = false;

            function isViewed(){
                if ((body[0].offsetHeight + (body[0].scrollTop || document.documentElement.scrollTop)) > element.offset().top){
                    if (!viewingNow && $scope[attr.isViewedEnter]){
                        $scope[attr.isViewedEnter]();
                        viewingNow = true;
                        $scope.$apply();
                    }
                }
                else{
                    if (viewingNow && $scope[attr.isViewedLeave]){
                        $scope[attr.isViewedLeave]();
                        viewingNow = false;
                        $scope.$apply();
                    }
                }
            }

            $(window).on('scroll', isViewed);
            $(window).on('resize', isViewed);
            $timeout(isViewed);

            $scope.$on('$destroy', function(){
                $(window).off('scroll', isViewed);
                $(window).off('resize', isViewed);
            });
        }
    }
});