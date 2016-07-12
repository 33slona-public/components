/**
 * Created by _BOB_ on 31.05.2016.
 */
slonComponents
.directive('fineScroll', function (){
    return {
        restrict: 'A',
        link: function($scope, $element, $attr){
            
            eval("var params = "+$attr.fineScroll);
            if(typeof(params) !== 'object') { params = null; }

            var overflowOnly = params && params.overflowOnly || false;

            $element.on('DOMMouseScroll mousewheel', function(ev) {
                var $this = $(this),
                    scrollHeight = this.scrollHeight,
                    height = $this.innerHeight();
                    if(overflowOnly && scrollHeight <= height) return true;
                var scrollTop = this.scrollTop,
                    delta = ev.originalEvent.wheelDelta,
                    up = delta > 0;
                var prevent = function() {
                    ev.stopPropagation();
                    ev.preventDefault();
                    ev.returnValue = false;
                    return false;
                };

                if (!up && -delta > scrollHeight - height - scrollTop) {
                    // Scrolling down, but this will take us past the bottom.
                    $this.scrollTop(scrollHeight);
                    return prevent();
                } else if (up && delta > scrollTop) {
                    // Scrolling up, but this will take us past the top.
                    $this.scrollTop(0);
                    return prevent();
                }
            });
        }
    };
});
