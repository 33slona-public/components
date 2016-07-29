slonComponents.directive('onlyNumbers', function() {
    return {
        require: 'ngModel',
        link: function (scope, element, attr, ngModel) {
            ngModel.$parsers.push(function (inputValue) {
                if (inputValue == undefined) return '';
                var transformedInput = inputValue.replace(/[,\.]+/g, '.');
                transformedInput = transformedInput.replace(/[^0-9+]/g, '');
                var temp = transformedInput.split('.');
                if (temp.length > 2) {
                    transformedInput = temp[0]+'.'+temp[1]+temp[2];
                }
                if (transformedInput != inputValue) {
                    ngModel.$setViewValue(transformedInput);
                    ngModel.$render();
                }

                return transformedInput;
            });
        }
    };
});
