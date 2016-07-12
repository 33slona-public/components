slonComponents.directive('angularTruSlider', function ($timeout, $compile, $http, $q, imagesManager, $window, $location,
                                                $templateRequest, $sce, $rootScope) {
        var scopeIds = [],
            keyboardBindings = [],
            elements = [];

        function checkElementsForVisible() {
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].checkVisible()) elements[i].setVisible();
                else break;
            }
        }

        function bindLazyLoadOnScroll(element) {
            $(element).on('scroll', checkElementsForVisible);
        }

        function unbindLazyLoadOnScroll(element) {
            $(element).unbind('scroll', checkElementsForVisible);
        }

        function SlideObject(el) {
            this.element = el;
            this.visible = false;
            var q = $q.defer();
            this.ifVisible = function () {
                return q.promise;
            };
            this.checkVisible = function () {
                if (this.visible) {
                    return this.visible
                }
                else {
                    var offset = this.element.offset();
                    var scrollTop = document.body.scrollTop;
                    if (slon.session.browser === 'Firefox') scrollTop = document.documentElement.scrollTop;
                    return document.body.offsetHeight + scrollTop > offset.top;
                }
            };
            this.setVisible = function () {
                q.resolve();
            };
        }

        var putOnAll = function (e) {
            e.preventDefault();
            e.stopPropagation();
        };

        var lang = {
            'photoShowUp' : {
                'ru' : 'Секунду,<br> фото сейчас появятся...',
                'en' : 'Just a moment, the photo will appear shortly'
            },
            'imageError' : {
                'ru' : 'Фотографий нет',
                'en' : '"There are no photos"'
            }
        };

        return {
            restrict: 'AE',
            scope: {
                slides: '=',
                animation: '@',
                duration: '@',
                timingFunction: '@',
                thumbsOn: '=?',
                thumbsIndent: '=?',
                shadow: '@',
                arrowsIndent: '@',
                arrowsSize: '@',
                loadingBlock: '@',
                loadingBlockFadeTime: '@',
                verticalIndent: '=?',
                horizontalIndent: '=?',
                keyNavigation: '=?',
                propertyInObjectForSlide: '@',
                propertyInObjectForThumb: '@',
                stretchByWidth: '=?',
                imagesLazyLoadOnScroll: '=?',
                onLoadImageText: '=?',
                seoTitle: '=?',
                onlyContentMode: '=?',
                lastInstance: '=?',
                iframe: '=?',
                syncWithSlider: '@'
            },
            link: function (scope, element) {
                scope.putOnAll = putOnAll;
                var slides = angular.copy(scope.slides),
                    slider,
                    html,
                    template,
                    linkFn,
                    durationInMs,
                    scrollBlock = element[0],
                    slideObject = new SlideObject(element),
                    lastDirectiveInNgRepeat = scope.lastInstance;

                if (!scope.animation) scope.animation = 'fade';

                if ($location.search().forBot === "1") scope.forRobot = true;

                if (scope.imagesLazyLoadOnScroll && !scope.forRobot &&
                    (slon.session.browser === 'Google Chrome' || slon.session.browser === 'Firefox')) {
                    elements.push(slideObject);
                    $timeout(function () {
                        if (lastDirectiveInNgRepeat) {
                            $timeout(function () {
                                checkElementsForVisible()
                            });
                            while (scrollBlock.offsetParent && (scrollBlock.offsetHeight === scrollBlock.scrollHeight)) {
                                if (scrollBlock.offsetParent) scrollBlock = scrollBlock.offsetParent;
                            }
                            if (!scrollBlock || scrollBlock.tagName === 'BODY') scrollBlock = window;
                            bindLazyLoadOnScroll(scrollBlock);
                            scope.$on("$destroy", function () {
                                elements.length = 0;
                                unbindLazyLoadOnScroll(scrollBlock);
                            });
                        }
                    })
                }
                else {
                    slideObject.setVisible();
                }

                scope.curPhoto = 0;
                var model3D;
                if (scope.iframe) {
                    model3D = {
                        images: {
                            small: "/static/images/3d.png",
                            src: "/static/images/white.png"
                        },
                        isActive: true,
                        url: $sce.trustAsResourceUrl(scope.iframe),
                        on: function () {
                            this.isActive = true;
                        },
                        off: function () {
                            this.isActive = false;
                        }
                    };
                    scope.model3D = model3D;
                    slides.unshift(model3D.images);
                }

                var fingerOnThumbs, dragShift = 0, lastDragShift = 0, shift = 0;

                if (scope.thumbsOn) {
                    scope.thumbs = angular.copy(slides);
                    var thumbShiftMin = -20, oneThumbsWidth = 10 + 97 + 10, clientWidth, thumbShiftMax;
                    scope.thumbsWidth = oneThumbsWidth * scope.thumbs.length + 2;

                    scope.thumbsStyles = {
                        'top': scope.thumbsIndent + 'px',
                        get transform(){
                            return 'translate3d(' + -shift + 'px, 0, 0)';
                        },
                        get width(){
                            return scope.thumbsWidth + 'px';
                        }
                    };

                    Object.defineProperties(scope.thumbsStyles, {
                        '-webkit-transform' : {
                            get : function(){
                                return this.transform;
                            },
                            enumerable : true
                        },
                        'transition-timing-function': {
                            get : function(){
                                return 'ease-out'
                            },
                            enumerable : true
                        },
                        'transition-duration' : {
                            get : function(){
                                return '0.15s'
                            },
                            enumerable : true
                        }
                    });

                    scope.thumbsMoveStart = function(e){
                        fingerOnThumbs = true;
                    };

                    scope.thumbsMoveEnd = function(e){
                        fingerOnThumbs = false;
                        lastDragShift = dragShift;
                    };

                    scope.thumbsMove = function(e){
                        dragShift = lastDragShift + e.gesture.deltaX;
                        thumbsShiftRecalc();
                    };

                    function setShiftLimits(shift){
                        shift = Math.max(shift, thumbShiftMin);
                        shift = Math.min(shift, thumbShiftMax);
                        return shift;
                    }

                    function thumbsShiftRecalc() {
                        clientWidth = element.find('.tru-slider').width();
                        thumbShiftMax = scope.thumbsWidth - clientWidth + 20;

                        if (scope.thumbsWidth > clientWidth) {
                            scope.thumbsShift = (scope.slideIndex - 0.5) * oneThumbsWidth - clientWidth / 2;
                            scope.thumbsShift = setShiftLimits(scope.thumbsShift);
                        } else {
                            scope.thumbsShift = (scope.thumbsWidth - clientWidth) / 2;
                        }
                        if (scope.thumbsWidth > clientWidth){
                            shift = setShiftLimits(scope.thumbsShift - dragShift);
                        }
                        else{
                            shift = scope.thumbsShift;
                        }
                        dragShift = -(shift - scope.thumbsShift);
                    }

                    thumbsShiftRecalc.withDigest = function () {
                        thumbsShiftRecalc();
                        scope.$apply();
                    };

                    $(window).bind('resize', thumbsShiftRecalc.withDigest);
                }

                if (slides && slides.length) {
                    if (scope.propertyInObjectForSlide) {
                        angular.forEach(slides, function (slide) {
                            slide.src = slide[scope.propertyInObjectForSlide];
                        })
                    }

                    if (scope.propertyInObjectForThumb) {
                        angular.forEach(slides, function (slide) {
                            slide.small = slide[scope.propertyInObjectForThumb];
                        })
                    }

                    durationInMs = parseInt(scope.duration);
                    scope.durationInSec = durationInMs / 1000;
                    scope.shadowClass = 'tru-slider__shadow';
                    if (scope.shadow) scope.shadowClass += '--' + scope.shadow;

                    function renderSlider() {
                        return $templateRequest('/templates/directives/slider.html')
                            .then(function (response) {
                                html = response;
                                template = angular.element(html);
                                linkFn = $compile(template);
                                linkFn(scope);
                                slider = template.appendTo(element);
                            });
                    }

                    function hideLoadingBlock() {
                        var loadingBlockFadeTime = parseInt(scope.loadingBlockFadeTime);
                        var loadingBlockFadeTimeInMs = loadingBlockFadeTime / 1000;
                        var loadingBlock = $('.' + scope.loadingBlock);
                        if (loadingBlockFadeTime) {
                            loadingBlock.css(
                                {'transition-duration': loadingBlockFadeTimeInMs + 's', 'opacity': 0});
                        }

                        return $timeout(function () {
                            loadingBlock.css('display', 'none');
                            if (scope.thumbsOn) thumbsShiftRecalc();
                            if (!scope.arrowsSize) scope.arrowsSize = 100;
                        }, loadingBlockFadeTime);
                    }

                    scope.isTouchDevice = function () {
                        return slon.session.device.supportTouch;
                    }

                    function iframePromise() {
                        var defer = $q.defer();

                        $timeout(function () {
                            var iframe = document.getElementById('sliderIframe');

                            iframe.onload = function () {
                                defer.resolve();
                                scope.$apply();
                            };

                            iframe.onerror = function () {
                                defer.reject();
                                scope.$apply();
                            };
                        });

                        return defer.promise;
                    }

                    function loadingFirstElement() {
                        scope.onLoadImageText = lang.photoShowUp[slon.config.lang];
                        scope.loadingFirstImage = true;
                        if (scope.model3D) {
                            return iframePromise();
                        }

                        return imagesManager.loadImage(scope.slidesArray[scope.curPhoto].src)
                    }

                    slideObject.ifVisible().then(function () {
                        renderSlider()
                            .then(loadingFirstElement)
                            .then(function () {
                                scope.loadingFirstImage = false;
                                return hideLoadingBlock();
                            }, function () {
                                scope.onLoadImageText = lang.imageError[slon.config.lang];
                            })
                    });

                    scope.slidesArray = new Array(3);
                    scope.slidesArray[1] = slides[0];
                    if (scope.forRobot) scope.slidesArray = slides;
                    scope.baseImg = slides[0].src;
                    scope.curPhoto = 1;
                    scope.slideIndex = 0;

                    var proxySlide,
                        oldSlideIndex,
                        gesture;


                    function loadNearImages(){
                        var prev, next;
                        if (prev = slides[scope.slideIndex - 1]){
                            imagesManager.loadImage(prev.src)
                        }
                        if (next = slides[scope.slideIndex + 1]){
                            imagesManager.loadImage(next.src)
                        }
                    }

                    loadNearImages();

                    function switchSlide(location, e, index, delta, gesturePromise, externalChanges) {
                        if (e) putOnAll(e);
                        if (scope.moveIsStart) return;
                        if (!externalChanges) scope.moveIsStart = true;
                        if (index !== scope.slideIndex) {
                            if (typeof index === 'number') {
                                if (index > scope.slideIndex) location = 'next';
                                if (index < scope.slideIndex) location = 'prev';
                            }

                            oldSlideIndex = scope.slideIndex;
                            if (location === 'next') {
                                proxySlide = 2;
                                scope.slideIndex = scope.slideIndex === slides.length - 1 ? 0 : scope.slideIndex + 1
                            }
                            if (location === 'prev') {
                                proxySlide = 0;
                                scope.slideIndex = scope.slideIndex === 0 ? slides.length - 1 : scope.slideIndex - 1
                            }

                            if (typeof index === 'number') scope.slideIndex = index;
                            loadNearImages();

                            var noAnimation;

                            function when3dModel() {
                                model3D.images.src = slides[scope.slideIndex].src;
                                noAnimation = true;
                            }

                            if (model3D) {
                                if (scope.slideIndex === 0) {
                                    model3D.on();
                                    when3dModel();
                                }
                                else if (model3D.isActive) {
                                    model3D.off();
                                    when3dModel();
                                }
                            }

                            scope.slidesArray[proxySlide] = slides[scope.slideIndex];

                            if (scope.onlyContentMode) scope.slidesArray[proxySlide].src = scope.baseImg;
                            if (!scope.onlyContentMode) {
                                scope.slidesArray[proxySlide].loadingImage = false;
                                if (!imagesManager.imageIsLoaded(scope.slidesArray[proxySlide].src)) {

                                    scope.slidesArray[proxySlide].loadingImage = true;

                                    function loadBeforeRewind() {
                                        var q = $q.defer();
                                        var point = new Date().getTime();
                                        imagesManager.loadImage(scope.slidesArray[proxySlide].src)
                                            .then(function () {
                                                var endPoint = new Date().getTime();
                                                var delta = endPoint - point;
                                                var duration = durationInMs + 100;
                                                if (delta <= duration) {
                                                    $timeout(function () {
                                                        q.resolve();
                                                    }, duration - delta);
                                                }
                                                else {
                                                    q.resolve();
                                                }
                                            }, function () {
                                                q.reject();
                                            })

                                        return q.promise;
                                    }

                                    loadBeforeRewind().finally(function () {
                                        scope.slidesArray[proxySlide].loadingImage = false;
                                    })

                                }
                            }

                            function rewind(delta) {
                                var curPhoto;
                                if (location === 'next') {
                                    curPhoto = 1 + delta;
                                    if (curPhoto > 2) curPhoto = 2;
                                    scope.curPhoto = curPhoto;
                                }
                                if (location === 'prev') {
                                    curPhoto = 1 - delta;
                                    if (curPhoto < 0) curPhoto = 0;
                                    scope.curPhoto = curPhoto;
                                }
                            }

                            function endSwitchSlide(slideIsNotChanged) {
                                if (externalChanges) {
                                    restore();
                                    var nullDefer = $q.defer();
                                    nullDefer.resolve();
                                    return nullDefer.promise;
                                }
                                else {
                                    return activateTransition()
                                        .then(restore)
                                }

                                function restore() {
                                    if (!slideIsNotChanged) {
                                        if (scope.thumbsOn) thumbsShiftRecalc();
                                        scope.slidesArray[1] = scope.slidesArray[proxySlide];
                                    }
                                    scope.curPhoto = 1;
                                }
                            }

                            if (!noAnimation) {
                                delta = delta || 1;
                                rewind(delta);
                                var switchPromise;

                                if (gesturePromise) {
                                    switchPromise = gesturePromise
                                        .then(function () {
                                            rewind(1);
                                            return endSwitchSlide()
                                        }, function (changeDirection) {
                                            scope.slideIndex = oldSlideIndex;
                                            scope.curPhoto = 1;
                                            if (!changeDirection) {
                                                return endSwitchSlide(true)
                                            }
                                        }, function (delta) {
                                            rewind(delta);
                                        })
                                }

                                else {
                                    switchPromise = endSwitchSlide()
                                }

                                switchPromise.finally(function () {
                                    if (gesture) {
                                        gesture = null;
                                    }
                                    fastGesture = false;
                                    scope.moveIsStart = false;
                                    if (!externalChanges && scope.syncWithSlider) {
                                        $rootScope.$broadcast('$sliderChanged' + scope.syncWithSlider, scope.slideIndex, scope.$id);
                                    }
                                });
                            }
                        }
                    };

                    scope.nextSlide = function (e) {
                        switchSlide('next', e, null, 1);
                    };

                    scope.prevSlide = function (e) {
                        switchSlide('prev', e, null, 1);
                    };

                    scope.goToSlide = function (e, index, externalChanges) {
                        switchSlide(null, e, index, null, null, externalChanges)
                    };

                    Object.defineProperties(scope, {
                        'nullTransition': {
                            get: function () {
                                if (fingerOnScreen) {
                                    return TRANSITION_WHEN_FINGER_ON_SCREEN;
                                }
                                else if (fastGesture) {
                                    return scope.durationInSec;
                                }
                                else {
                                    return 0;
                                }
                            }
                        }
                    });

                    var TRANSITION_WHEN_FINGER_ON_SCREEN = 0.001;

                    var curDirection,
                        fastGesture,
                        fingerOnScreen;

                    scope.activeTransition = slon.session.device.supportTouch && scope.animation !== 'fade';

                    function activateTransition() {
                        scope.activeTransition = (scope.animation === 'fade' && fingerOnScreen) ? false : true;
                        return $timeout(function () {
                            scope.activeTransition = false;
                        }, durationInMs)
                    }

                    function getPercentDelta(e) {
                        var width = $(e.srcElement).width();
                        var percentPx = width / 100;
                        var percents = Math.abs(e.gesture.deltaX / percentPx);
                        if (scope.animation === 'fade') return 1;
                        return percents / 100;
                    }

                    function drag(e, location) {
                        if (fingerOnThumbs) return;
                        fastGesture = false;
                        if (gesture && curDirection && curDirection !== location) {
                            gesture.reject(true);
                        }
                        curDirection = location;
                        var delta = getPercentDelta(e);
                        if (!gesture) {
                            gesture = $q.defer();
                            switchSlide(location, e, null, delta, gesture.promise)
                        }

                        var accel = Math.abs(e.gesture.deltaX) / e.gesture.deltaTime;
                        if (accel > 1) {
                            fastGesture = true;
                        }

                        gesture.notify(delta);
                    }

                    scope.dragLeft = function (e) {
                        drag(e, 'next');
                    };

                    scope.dragRight = function (e) {
                        drag(e, 'prev');
                    };

                    scope.dragEnd = function (e) {
                        if (fingerOnThumbs) return;
                        var delta = getPercentDelta(e);
                        if (gesture) {
                            var accel = Math.abs(e.gesture.deltaX) / e.gesture.deltaTime;
                            if (accel > 0.35) {
                                gesture.resolve();
                            }
                            else {
                                if (delta >= 0.5) {
                                    gesture.resolve();
                                }
                                else {
                                    gesture.reject();
                                }
                            }
                        }
                        fingerOnScreen = false;
                    };

                    scope.dragStart = function () {
                        if (!scope.activeTransition) {
                            fingerOnScreen = true;
                        }
                        scope.moveIsStart = false;
                    };

                    if (scope.syncWithSlider) {
                        scope.$on('$sliderChanged' + scope.syncWithSlider, function (e, slideIndex, scopeId) {
                            if (scopeId !== scope.$id) {
                                scope.moveIsStart = false;
                                scope.goToSlide(null, slideIndex, true);
                            }
                        });
                    }

                    scope.animationsStyles = {
                        get fade() {
                            var animation = {
                                'width': 'calc(100% - ' + scope.horizontalIndent * 2 + 'px)',
                                'height': 'calc(100% - ' + scope.verticalIndent * 2 + 'px)',
                                'transition-duration': (scope.activeTransition ? scope.durationInSec : 0) + 's',
                                'transition-timing-function': scope.timingFunction
                            };

                            if (isDevice(['mobile', 'mobile-landscape', 'tablet'])) {
                                animation.width = '100%';
                                animation.height = '100%';
                            }

                            return animation;
                        },
                        get carousel() {
                            this._carousel = this._carousel || {};
                            this._carousel.transform = 'translate3d(' + (-100 / scope.slidesArray.length * scope.curPhoto) + '%, 0, 0)';
                            this._carousel['-webkit-transform'] = this._carousel['transform'];
                            this._carousel['transition-duration'] = (scope.activeTransition ? scope.durationInSec : scope.nullTransition) + 's';
                            this._carousel['transition-timing-function'] = scope.timingFunction;
                            return this._carousel;
                        }
                    }

                    scope.shadowObject = {};
                    scope.shadowObject[scope.shadowClass] = scope.shadow;

                    var onKeyDown = function (e) {
                        if (scope.activeTransition) return;
                        if (!(model3D && model3D.isActive) && scopeIds[scopeIds.length - 1] === scope.$id) {
                            switch (e.keyCode) {
                                case 39:
                                    switchSlide('next');
                                    scope.$apply();
                                    break;
                                case 37:
                                    switchSlide('prev');
                                    scope.$apply();
                                    break;
                            }
                        }
                    };

                    function unbindKeyboard() {
                        if (keyboardBindings[scope.$id]) {
                            $(document).unbind('keydown', keyboardBindings[scope.$id]);
                            keyboardBindings[scope.$id] = null;
                            scopeIds.pop();
                        }
                    }

                    scope.$watch('keyNavigation', function () {
                        if (scope.keyNavigation) {
                            scopeIds.push(scope.$id);
                            keyboardBindings[scope.$id] = onKeyDown;
                            $(document).bind('keydown', keyboardBindings[scope.$id]);
                        }
                        else {
                            unbindKeyboard();
                        }
                    });

                    scope.$on("$destroy", function () {
                        if (slider) slider.remove();
                        unbindKeyboard();
                        if (scope.thumbsOn) $(window).unbind('resize', thumbsShiftRecalc.withDigest);
                    });
                }
                else {
                    scope.onLoadImageText = lang.imageError[slon.config.lang];
                }
            }
        };
    }
);
