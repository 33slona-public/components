slonComponents.directive('onlyNumbers', function() {
    return {
        require: 'ngModel',
        link: function (scope, element, attr, ngModel) {
            var maxLen = attr['onlyNumbers']*1 || 16;
            ngModel.$parsers.push(function (inputValue) {
                if (inputValue == undefined) return '';
                var transformedInput = inputValue.replace(/[,\.]+/g, '.');
                if(transformedInput.length > maxLen) {
                    transformedInput = transformedInput.slice(0, maxLen);
                }
                transformedInput = transformedInput.replace(/[^0-9]+/g, '');
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
