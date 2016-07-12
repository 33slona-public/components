slonApp.factory('$viewport', function(){
    var viewportTag = $('#viewportTag');

    var deviceOrientedViewport = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
    var standartViewport = 'initial-scale=0';

    viewportTag.setDeviceOriented = function(){
        viewportTag.isDeviceOriented = true;
        viewportTag.attr('content',deviceOrientedViewport);
    };

    viewportTag.setStandart = function(){
        viewportTag.isDeviceOriented = false;
        viewportTag.attr('content', standartViewport);
    };

    return viewportTag;
});