'use strict';

slonComponents.factory('requests', ['$http','$timeout','$q', function($http, $timeout, $q){
    function getRequest(path, params) {
        return $http.get(slon.config.apiUrl + path , {
            params: params
        })
    }

    function postRequest(path, postParams, getParams) {
        return $http({
            method: 'POST',
            params: getParams,
            data: $.param(JSON.parse(JSON.stringify(postParams))),
            url: slon.config.apiUrl + path,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        })
    }

    function deleteRequest(path, params){
        return $http({
            method: 'DELETE',
            url: slon.config.apiUrl + path,
            params: params
        })
    }

    function mock(data, ms){
        var defer = $q.defer();
        $timeout(function(){
            data ? defer.resolve(data) : defer.reject();
        },ms);
        return defer.promise;
    }

    function formData(path, getParams, formData, formDataName) {
        return $http({
            method: 'POST',
            url: slon.config.apiUrl + path,
            params: getParams,
            transformRequest: function () {
                var _formData = new FormData();
                angular.forEach(formData, function (val, key) {
                    if (Array.isArray(val)) {
                        var i, file;
                        for (i = 0; i < val.length; i++) {
                            file = val[i];
                            _formData.append(formDataName + '[' + key + '][]', file);
                        }
                    }
                    else {
                        _formData.append(formDataName + '[' + key + ']', val);
                    }
                });
                return _formData;
            },
            headers: {'Content-Type': undefined}
        })
    }

    return {
        get: getRequest,
        post: postRequest,
        delete: deleteRequest,
        formData : formData,
        mock: mock
    }
}]);