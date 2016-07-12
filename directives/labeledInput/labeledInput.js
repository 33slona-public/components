'use strict';

slonComponents.directive('labeledInput', function () {

    return {
        restrict: 'C',
        link: link
    };

    function link($scope, element, attrs) {
        var label = element.find('.labeled-input__label'),
            input = element.find('input'),
            active;

        function setInputAsActive(){
            active = true;
            label.addClass('active');
            input.focus();
        }

        element.on('click', function(){
            if (!active){
                setInputAsActive();
            }
        });

        $scope.$watch(function(){
           return input[0].value
        }, function(nv,ov){
            if (nv && !active) setInputAsActive();
        });

        input.on('blur', function (e) {
            if (!input[0].value) {
                label.removeClass('active');
                active = false;
            }
        });
    }
});