//all data saved in storage[name + 'InputsData'], example: $sessionStorage['NameInputsData']
slonComponents.directive('inputStorage', function ($sessionStorage, $localStorage, $rootScope) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function (scope, elem, attr, ngModel) {
            var inputName = attr.inputStorage || attr.name;
            if (inputName) {
                var prefix = 'InputsData';
                var name = inputName + prefix;
                var storageType = attr.storageType;
                var storage;
                if (!storageType) storageType = 'sessionStorage';
                switch (storageType) {
                    case "sessionStorage":
                        storage = $sessionStorage;
                        break;
                    case "localStorage":
                        storage = $localStorage;
                        break;
                }


                var currentValueInStorage;
                if (currentValueInStorage = storage[name]) {
                    var decoratorName = attr.inputValueDecorator;
                    if (decoratorName) {
                        if (typeof scope[decoratorName] === 'function') {
                            currentValueInStorage = scope[decoratorName](currentValueInStorage);
                        }
                    }
                    ngModel.$setViewValue(currentValueInStorage);
                    ngModel.$render();
                }

                function checkNgModel() {
                    return ngModel.$modelValue;
                }

                function saveInStorage(newValue, oldValue) {
                    storage[name] = newValue;
                }

                scope.$watch(checkNgModel, saveInStorage);
            }
        }
    }
});
