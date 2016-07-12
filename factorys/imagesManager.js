'use strict';

slonComponents.factory('imagesManager', ['$q', function($q){
    function load(src){
        var q = $q.defer();
        if (images[src]) {
            q.resolve();
            return q.promise;
        }
        var image = new Image();
        image.onerror = function(){
            q.reject();
        };
        image.onload = function(){
            q.resolve();
        };
        image.src = src;
        return q.promise;
    }

    var images = {};

    return {
        loadImage: function(imagesList) {
            if (!Array.isArray(imagesList)){
                imagesList = [imagesList];
            }
            var promises = [];
            for(var i=0;i<imagesList.length;i++){
                (function(i){
                    promises.push(
                        load(imagesList[i])
                            .then(function(){
                                images[imagesList[i]] = true;
                            })
                    );
                })(i);
            }
            return $q.all(promises);
        },
        imageIsLoaded: function(src){
            return images[src];
        }
    }
}]);