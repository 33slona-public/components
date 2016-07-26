'use strict';
slonComponents.config(function($urlRouterProvider){
    $urlRouterProvider.otherwise(function ($injector, $location) {
        var metaTags = $injector.get('metaTags');
        metaTags['statusCode'] = 404;
    });
});

slonComponents.provider('metaTags', function(){
    var defaultMetaData;
    
    this.default = function(data){
        defaultMetaData = data;
    };
    
    this.$get = ['$state','$location','$rootScope',function($state, $location, $rootScope){
        var pages = {};
        var images = {}, currentImage = { imgUrl: '' };

        var metaTags;
        var currentMeta = {};
        var page = {title : defaultMetaData.title, description : defaultMetaData.description, keywords: defaultMetaData.keywords};

        function addPage(data, imageUrl){
            var currentStateName = $state.current.name;
            pages[currentStateName] = data;
            images[currentStateName] = imageUrl || '';
        }

        function deleteForBot(s) {
            return s.replace(/([?&])forBot=1(&{0,1})/, function (match, p1, p2) { return p2 ? p1 : ''; });
        }

        function update(prefix){
            function _update(prefix){
                angular.forEach(defaultMetaData, function(content, tag){
                    currentMeta[prefix + tag] = content;
                    if (page[tag]) page[tag] = content;
                });
                angular.forEach(currentPage, function(content, tag){
                    currentMeta[prefix + tag] = content;
                    if (page[tag]) page[tag] = content;
                });
                currentMeta[prefix + 'url'] = deleteForBot($location.absUrl());
            }

            var currentStateName = $state.current.name;
            var parentStateName = $state.current.name.split('.')[0];
            var currentPage = pages[currentStateName];
            if (!currentPage) currentPage = pages[parentStateName] || $state.current.meta || defaultMetaData;
            var assocFields = {
                "title" : "mrc__share_title"
            };

            _update(prefix);

            angular.forEach(assocFields, function(newField, sourceField){
                currentMeta[newField] = currentPage[sourceField] || defaultMetaData[sourceField];
            });

            currentImage.imgUrl = images[currentStateName] || '';
        }

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
            metaTags.statusCode = 200;
            update('og:');
        });

        metaTags = {
            currentMeta : currentMeta,
            currentImage : currentImage,
            page: page,
            addPage: addPage,
            update : update
        };

        return metaTags;
    }]
});