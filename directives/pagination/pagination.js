'use strict';

slonComponents.directive( 'paginationBlock', [
    'Pagination','L',
    function(Pagination, L) {
        return {
            restrict: 'E',
            scope: {
                for: '@',
                isLoaded: '='
            },
            templateUrl: '/components/directives/pagination/pagination.html',
            link: function ( scope, element ) {
                scope.for = scope.for.charAt(0).toUpperCase() + scope.for.slice(1);
                scope.L = L;
                scope.$on('$updatePagination' + scope.for, function(event, data){
                    scope.onclick = data.onclick;
                    scope.pagination = new Pagination(
                        data.total, data.groupSize, data.currentPage, data.url
                    );
                });
                if (scope.isLoaded) scope.isLoaded.resolve();
            }
        };
    }
]);

slonComponents.factory('Pagination', [function(){
    var Pagination;

    function calculateGroup(page, groupSize){
        return Math.ceil(page/groupSize);
    }

    function generatePagesWithUrl(url, pages){
        function changePageInUrl(arr, num) {
            var page = arr[pagePlace].split('=');
            page[1] = num;
            arr[pagePlace] = page.join('=');
        }

        var arr = url.split('&'), page, pagePlace;
        var obj = {
            prev: angular.copy(arr),
            next: angular.copy(arr)
        };
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].lastIndexOf('page') !== -1) {
                page = arr[i];
                pagePlace = i;
                break;
            }
        }

        for (var k in pages) {
            if (pages.hasOwnProperty(k)) {
                var propName = k === 'next' || k === 'prev' ? k : pages[k];
                obj[propName] = angular.copy(arr);
                changePageInUrl(obj[propName], pages[k]);
            }
        }

        angular.forEach(obj, function (arr, key) {
            obj[key] = arr.join('&')
        });

        return obj;
    }

    Pagination = function (total, groupSize, currentPage, url){
        this.total = total;
        this.currentPage = parseInt(currentPage);
        this.groupSize = groupSize;
        this.groupNumber = calculateGroup(this.currentPage, this.groupSize);
        var max = this.groupNumber * this.groupSize;
        var min = max - this.groupSize;
        if (max > this.total) max = this.total;
        this.pages = _.range(min + 1, max + 1);
        this.pages['prev'] = this.pages[0] - 1;
        this.pages['next'] = this.currentPage + 1;
        this.pagesWithUrl = generatePagesWithUrl(url, this.pages);
        this.isFirstPageGroup = this.groupNumber === 1;
        this.isLastPageGroup = this.groupNumber === Math.ceil(this.total/this.groupSize);
        this.noPagination = this.total === 1 || !this.total;
    };

    return Pagination;
}]);