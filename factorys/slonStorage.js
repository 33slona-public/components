'use strict';

slonComponents.factory('slonStorage', ['$rootScope',function($rootScope){

        var prefix = 'ls',
            watchingFields = {},
            watcherOnStorageIsOn;

        function WatchingField(obj){
            this.newValue = obj.newValue;
            this.oldValue = obj.oldValue;
            this.callback = obj.callback;
        }

        function compareValueWithLocalStorage(valueFromEvent, comparedValue){
            var eventNewValue = JSON.parse(valueFromEvent);
            var typeOfEventValue = typeof eventNewValue;
            var typeOfComparedValue = typeof comparedValue;

            if (typeOfEventValue === typeOfComparedValue){
                if (typeOfEventValue === 'object' && typeOfComparedValue === 'object'){
                    angular.forEach(comparedValue, function(val, key){
                        if (eventNewValue[key] != val) return false;
                    });
                }
                else{
                    if (eventNewValue != comparedValue) return false;
                }
            }
        }

        WatchingField.prototype = {
            compareValuesWithEvent : function(event){
                if (this.newValue){
                    compareValueWithLocalStorage(event.newValue, this.newValue);
                }

                if (this.oldValue){
                    compareValueWithLocalStorage(event.oldValue, this.oldValue);
                }

                return true;
            }
        };

        function onStorageEvent(e){
            var storageEvent = e.originalEvent;
            var watchedField = watchingFields[storageEvent.key];
            if (storageEvent.key == 'ls.currentUser'){
                if (watchedField && watchedField.compareValuesWithEvent(storageEvent)) {
                    watchedField.callback();
                    $rootScope.$apply();
                }
            }
        }

        return {
            get: function(field){
                var data = localStorage[(prefix ? prefix + '.' : '') + field];
                if (data) return JSON.parse(data);
                return null;
            },
            set: function(field, arg){
                localStorage[(prefix ? prefix + '.' : '') + field] = JSON.stringify(arg);
                return arg;
            },
            remove: function(field){
                field = (prefix ? prefix + '.' : '') + field;
                localStorage.removeItem(field);
            },
            watch : function(field, newValue, oldValue, callback){
                watchingFields[prefix + '.' + field] = new WatchingField({
                    "newValue" : newValue ? newValue : false,
                    "oldValue" : oldValue ? oldValue : false,
                    "callback" : callback
                });
                if (!watcherOnStorageIsOn) {
                    $(window).on('storage', onStorageEvent);
                    watcherOnStorageIsOn = true;
                }
            },
            removeWatch : function(field){
                delete watchingFields[field];
                if (watcherOnStorageIsOn && !Object.keys(watchingFields).length) {
                    $(window).off('storage', onStorageEvent);
                    watcherOnStorageIsOn = false;
                }
            }
        }
    }]);