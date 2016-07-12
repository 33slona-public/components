slonComponents.factory('scrollService', function($q){
    var body = $("body,html");

    /**
     *
     * @param params {Object} JS Object
     * @param params.top {Number} Position to scroll
     * @param params.offset {Number} Offset from position to scroll
     * @param params.bottom {Number} Position to scroll
     * @param params.selector {String} JQuery selector, scroll to this dom element
     * @param params.time {Number} Animate time
     */
    function go(params){
        var q = $q.defer();
        params = params || {};
        var scrollTop;
        if (params.selector) scrollTop = $(params.selector).offset().top;
        if (typeof params.top === 'number') {
            scrollTop = params.top;
        }
        if (typeof params.offset === 'number') {
            scrollTop += params.offset;
        }
        if (typeof params.bottom === 'number'){
            scrollTop = body[0].scrollHeight - params.bottom;
        }
        body.stop().animate({scrollTop: scrollTop}, params.time || 100, function(){
            q.resolve();
        });
        return q.promise;
    }
    
    var scrollService = {
        go : go
    };
    
    return scrollService;
});