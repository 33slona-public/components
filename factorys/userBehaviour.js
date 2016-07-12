slonComponents.factory('userBehaviour', function($rootScope, $state, $location){
    var exitControlStates = [], userBehaviour, startUrl = $location.absUrl();

    function getStateParentName(){
        var stateName = name ? name : $state.current.name;
        return stateName.split('.')[0];
    }
    
    function ExitControlState(options){
        this.stateName = $state.current.name;
        this.parentName = getStateParentName();
        this.text = options.text;
        this.modalText = options.modalText;
        this.askOnParentExit = options.askOnParentExit;
    }

    function checkForExitControl(event, toState, toParams, fromState, fromParams, options){
        var toStateName = toState.name;
        var toParamsObj = angular.copy(toParams);
        var toParentStateName = getStateParentName(toStateName);
        var fromParentStateName = getStateParentName(fromState.name);
        var sameParent = toParentStateName === fromParentStateName;
        var controlledState = _.find(exitControlStates, {stateName : fromState.name});
        var controlledParentState = _.find(exitControlStates, {parentName : getStateParentName()});

        // Для того чтобы обеспечить нормальное поведение в пределах родителя
        if (sameParent && controlledParentState && controlledParentState.askOnParentExit) return;

        // Не давать возможность уйти с контроллируемого стейта (или в случае если контроллируется род. стейт) без потверждения
        if (controlledState || (controlledParentState && controlledParentState.askOnParentExit)) {
            event.preventDefault();
            var text = (controlledState && controlledState.modalText) ||
                (controlledParentState && controlledParentState.modalText);

            $rootScope.$broadcast('$openModalWindow', {
                windowType : "confirm",
                params : [text, false, function(){
                    disableAskWhenExit();
                    $state.go(toStateName, toParamsObj);
                }]
            });
        }
    }

    var beforeUnloadFunctions = [];
    
    window.onbeforeunload = function(){
        if (beforeUnloadFunctions.length) {
            for (var i = 0; i < beforeUnloadFunctions.length; i++) {
                beforeUnloadFunctions[i]();
            }
        }
        $rootScope.$apply();
        var controlledState = _.find(exitControlStates, {stateName : $state.current.name});
        var parentControlledState = _.find(exitControlStates, {parentName : getStateParentName()});
        if (controlledState) return controlledState.text;
        if (parentControlledState && parentControlledState && parentControlledState.askOnParentExit) return parentControlledState.text;
    };

    $rootScope.$on('$stateChangeStart', checkForExitControl);

    function askWhenExit(options){
        var exitControlOptions = new ExitControlState(options);
        exitControlStates.push(exitControlOptions);
    }

    function disableAskWhenExit(){
        var controlledState = _.find(exitControlStates, {stateName : $state.current.name});
        var parentControlledState = _.find(exitControlStates, {parentName : getStateParentName()});
        var index = exitControlStates.indexOf(controlledState || parentControlledState);
        if (index || index === 0) exitControlStates.splice(index, 1);
    }

    userBehaviour = {
        askWhenExit : askWhenExit,
        disableAskWhenExit : disableAskWhenExit,
        getReferrer : function(){
            return startUrl;
        },
        clearReferrer : function(){
            startUrl = null;
        },
        addCodeBeforeUnload : function(f){
            if (typeof f === 'function') beforeUnloadFunctions.push(f);
        },
        urlHaveUtm : function(){
            return $location.absUrl().lastIndexOf('utm') !== -1;
        }
    };
    
    return userBehaviour;
});