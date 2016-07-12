slonComponents.directive('smsTimer', function($interval, L) {
    return {
        restrict: 'E',
        scope: {
            smsTimeToWait : '=',
            smsSendFunction: '&'
        },
        template: '<span><span ng-if="timeToWait">{{L.g.auth.waitingAgainSendText}} {{timeToWait}} {{L.w(\'secondsAlt\', timeToWait)}}</span>' +
        '<span class="solid" ng-if="timeToWait === 0" ng-click="sendSms()">{{L.g.auth.sendAgain}}</span></span>',
        link: function ($scope) {
            var interval;
            $scope.L = L;
            function startTimer(){
                $scope.timeToWait = parseInt($scope.smsTimeToWait);
                interval = $interval(oneSecondForward, 1000);
            }
            function oneSecondForward(){
                $scope.timeToWait -= 1;
                if (!$scope.timeToWait) {
                    $interval.cancel(interval);
                }
            }
            $scope.sendSms = function(){
                $scope.smsSendFunction();
                startTimer();
            };
            startTimer();
        }
    }
});