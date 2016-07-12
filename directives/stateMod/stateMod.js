'use strict';

/**
 * @ngdoc directive
 * @name stateMod
 *
 * @description
 * Replace of modifier class name of element, when $stateChangeSuccess event started.
 *
 * @element all
 * @param {Object} JS Object. Property value in object is class name, property name - parent state or specific state.
 * If property value have '--' then it is modifier, if property value have '+' class is adding,
 * else class has been replaced.
 * If property name have '=' then strictly confirm words containing in state, else if the word is contained in the state
 *
 * @example
 * <example class="example" state-mod="{'example-replace' : 'example', 'example-modifier' : '--example', 'example3:example4': '--example'}">
 * </example>
 */

slonComponents.directive( 'stateMod', [
    '$timeout','$state',
    function($timeout, $state) {
        return {
            restrict: 'A',
            link: function ( scope, element, attr ) {
                var baseClass = element.attr('class').split(' ');
                var rules;
                eval('rules=' + attr.stateMod);
                angular.forEach(rules, function(mod, stateName){
                    if (stateName.lastIndexOf(':') !== -1){
                        var mods = stateName.split(':');
                        delete rules[stateName];
                        if (mods.length > 1){
                            for(var i=0;i<mods.length;i++){
                                rules[mods[i].replace(/\s+/g, '')] = mod;
                            }
                        }
                        else{
                            rules[mods[i].replace(/[\s\:]+/g, '')] = mod;
                        }
                    }

                });

                function setModificator(){
                    var currentStateName = $state.current.name;
                    var newClass = angular.copy(baseClass);
                    var mainClass = newClass[0];

                    function setClass(stateName){
                        var isModifier = '',
                            isAddingMode,
                            addedClass = rules[stateName];

                        if (rules[stateName].slice(0,2) == '--') isModifier = true;
                        if (rules[stateName].slice(0,1) == '+') {
                            addedClass = rules[stateName].slice(1);
                            isAddingMode = true;
                        }

                        newClass[0] = ((isModifier || isAddingMode) ? (newClass[0] + ' ' + (isModifier && mainClass)) : '') + addedClass;
                    }

                    angular.forEach(rules, function(mod, stateName){
                        var condition;

                        if (stateName.slice(0,1) === '=') {
                            condition = currentStateName === stateName.slice(1);
                        }
                        else {
                            condition = currentStateName.lastIndexOf(stateName) !== -1 &&
                            currentStateName.lastIndexOf('.' + stateName) == -1;
                        }

                        if (condition) setClass(stateName);
                    });

                    element.attr('class', newClass.join(' '));
                }

                setModificator();

                scope.$on('$stateChangeSuccess', setModificator);
            }
        };
    }
]);

