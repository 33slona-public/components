slonComponents.provider('searchParams', function () {
    var groupsConf = [],
        paramsConf = [];

    this.param = function (param) {
        paramsConf.push(param);
        return this;
    };

    this.group = function (param) {
        groupsConf.push(param);
        return this;
    };

    this.$get = ['$location', '$state', function ($location, $state) {
        var urlParams = $location.search();
        var stateUrl = $state.get('search').url.split('/');
        var curUrl = $location.path().split('/');
        var seoParams = {};

        for (var i = 0; i < stateUrl.length; i++) {
            var part = stateUrl[i],
                paramName;
            if (part.lastIndexOf(':') !== -1) {
                paramName = part.split(':')[1];
                seoParams[paramName] = curUrl[i];
            }
        }

        function GroupOfParams() {}

        GroupOfParams.prototype = {
            getDataForRequest: getAllDataForRequest,
            updateUrl: updateAllUrl,
            getUrl: getAllUrl,
            compileUrl: compileUrl,
            updateTag: updateTags,
            setToNull: setToNullAll
        };

        function SearchParams() {
            this.all = new GroupOfParams();
            this.groups = new GroupOfParams();
            this.tags = [];
        }

        SearchParams.prototype = Object.create(GroupOfParams.prototype);

        SearchParams.prototype.build = function () {
            for (var i = 0; i < paramsConf.length; i++) {
                var paramConfig = paramsConf[i];
                searchParams.all[paramConfig.name] = new paramsConstructors[paramConfig.type](paramConfig);
            }
            for (var i = 0; i < groupsConf.length; i++) {
                var groupConfig = groupsConf[i];
                searchParams.groups[groupConfig.name] = new GroupOfParams();
                for (var j = 0; j < groupConfig.params.length; j++) {
                    var name = groupConfig.params[j];
                    var config = _.extend({name: name}, groupConfig.config);
                    searchParams.all[name] = searchParams.all[name] || new paramsConstructors[groupConfig.config.type](config);
                    searchParams.groups[groupConfig.name][name] = searchParams.all[name];
                }
            }
        };

        SearchParams.prototype.byPass = function (cb, result) {
            for (var key in this.all) {
                if (this.all.hasOwnProperty(key)) {
                    var param = this.all[key];
                    cb(param, key, result);
                }
            }
            return result;
        };

        SearchParams.prototype.get = function (paramName) {
            return this.all[paramName];
        };

        var searchParams = new SearchParams(),
            paramsConstructors = {};

        function getParamFromUrl(params) {
            if (params.haveSeo) {
                if (seoParams[params.name] && seoParams[params.name] !== slon.config.ignoreSeoKey) {
                    return params.haveSeo(seoParams[params.name]);
                }
            }
            return urlParams[params.name] || '';
        }

        function getAllDataForRequest() {
            return this.byPass(function (param, key, result) {
                if (param.isNotNull()) {
                    result[key] = param.getDataForRequest();
                }
            }, {})
        }

        function getAllUrl() {
            return this.byPass(function (param, key, result) {
                if (param.isNotNull()) {
                    result[param.name] = param.getUrl();
                }
            }, {});
        }

        function updateAllUrl() {
            return this.byPass(function (param, key, result) {
                var urlIsUpdated = param.updateUrl();
                var typeOfRes = typeof urlIsUpdated;
                if (urlIsUpdated && (typeOfRes !== 'object' || typeOfRes === 'object' && param.isNotNull())) {
                    result[param.name] = urlIsUpdated;
                }
            }, {});
        }

        function updateTags() {
            return this.byPass(function (param, key, result) {
                param.updateTag();
            });
        }

        function updateTag() {
            if (this.haveTag) {
                var posInTagArr = searchParams.tags.indexOf(this);
                if (this.isNotNull()) {
                    if (posInTagArr === -1) searchParams.tags.push(this);
                }
                else {
                    if (posInTagArr !== -1) searchParams.tags.splice(posInTagArr, 1);
                }
            }
        }

        function setToNullAll() {
            this.byPass(function (param, key, result) {
                param.setToNull();
            })
        }

        function compileUrl(obj) {
            var url = $state.href("search", obj) + '/?';
            var keys = Object.keys(obj);

            for (var i = 0; i < keys.length; i++) {
                var paramName = keys[i];
                var paramValue = obj[paramName];
                if (i !== 0) url += '&';
                url += paramName + '=' + paramValue;
            }

            return url;
        }

        function AbstractParam(params) {
            _.extend(this, params);
            this.paramFromUrl = getParamFromUrl(params);
        }

        AbstractParam.prototype = {
            nameInUrl: function () {
                var paramName = this.parent ?
                    ( this.parent + this.name.substr(0, 1).toUpperCase() + this.name.substr(1) ) : this.name;
                return paramName;
            },
            getDataForRequest: function () {
                if (this.requestDecorator) return this.requestDecorator[this.value];
                return this.value;
            },
            updateUrl: function () {
                var oldUrl, newUrl;
                oldUrl = this.getBrowserUrl();
                $location.search(this.nameInUrl(), this.isNotNull() ? this.getUrl() : null);
                newUrl = this.getBrowserUrl();
                return oldUrl !== newUrl;
            },
            getBrowserUrl: function () {
                return $location.search()[this.nameInUrl()];
            },
            getUrl: function () {
                return this.value + '';
            },
            isNotNull: function () {
                return !!(this.value && this.value !== '0');
            },
            setToNull: function () {
                this.value = null;
            },
            updateTag: updateTag
        };

        (function (params) {
            params.base = BaseParam;

            function BaseParam(params) {
                AbstractParam.call(this, params);
                var isNumberValue = this.paramFromUrl == (this.paramFromUrl * 1);
                this.value = isNumberValue ? this.paramFromUrl * 1 : this.paramFromUrl;
                this.value = this.value || this.defaultVal;
            }

            BaseParam.prototype = Object.create(AbstractParam.prototype);

            params.range = RangeParam;

            function RangeParam(params) {
                AbstractParam.call(this, params);
                this.paramFromUrl = (this.paramFromUrl && this.paramFromUrl.split('to')) || [];
                this.value = {
                    min: this.paramFromUrl[0],
                    max: this.paramFromUrl[1]
                };
            }

            RangeParam.prototype = Object.create(AbstractParam.prototype);

            RangeParam.prototype.getUrl = function () {
                return this.value.min + 'to' + this.value.max;
            };

            RangeParam.prototype.isNotNull = function () {
                return typeof (this.value.min * 1) === 'number' && (this.value.max * 1 > 0);
            };

            RangeParam.prototype.setToNull = function () {
                this.value.min = 0;
                this.value.max = 0;
            };

            params.list = ListParam;

            function ListParam(params) {
                AbstractParam.call(this, params);
                this.value = (this.paramFromUrl && this.paramFromUrl.split('and')) || [];
            }

            ListParam.prototype = Object.create(AbstractParam.prototype);
            ListParam.prototype.isNotNull = function () {
                return !!this.value.length;
            };

            ListParam.prototype.setToNull = function () {
                this.value.length = 0;
            };

            ListParam.prototype.getUrl = function () {
                return this.value.join('and');
            };

            params.options = Options;

            function Options(params) {
                AbstractParam.call(this, params);
                this.options = params.options;
                this.value = this.paramFromUrl || this.options[0];
            }

            Options.prototype = Object.create(AbstractParam.prototype);

            params.composite = Composite;

            function Composite(params) {
                AbstractParam.call(this, params);
                for (var i = 0; i < params.subParams.length; i++) {
                    var paramConfig = JSON.parse(JSON.stringify(params.subParams[i]));
                    paramConfig.parent = params.name;
                    this[paramConfig.name] = new paramsConstructors[paramConfig.type](paramConfig);
                }
            }

            Composite.prototype = Object.create(GroupOfParams.prototype);
            Composite.prototype.byPass = function (cb, result) {
                for (var i = 0; i < this.subParams.length; i++) {
                    var subParam = this.subParams[i];
                    cb(this[subParam.name], subParam.name, result)
                }
                return result;
            };
            Composite.prototype.isNotNull = function () {
                var result = true;
                this.byPass(function (param, key) {
                    result = result && param.isNotNull();
                });
                return result;
            };
            Composite.prototype.updateTag = updateTag;

            function convertToPriceWithSpaces(num) {
                return num ? num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ") : 0;
            }

            function convertToPriceWithoutSpaces(string) {
                return string.replace(/\s+/g, '');
            }

            function roundingPrice(min, max) {
                var obj = {};
                var minEnd = min % 1000;
                var maxEnd = max % 1000;
                if (minEnd) obj.min = min - minEnd;
                else obj.min = min;
                if (maxEnd) obj.max = max - maxEnd + 1000;
                else obj.max = max;
                return obj;
            }

            function Price(params) {
                RangeParam.call(this, params);
                Price.prototype.updateFormattedPrice.call(this);
            }

            Price.prototype = Object.create(RangeParam.prototype);
            Price.prototype.setPrice = function (obj) {
                var roundedPrice = roundingPrice(obj.min, obj.max);
                this.value.min = roundedPrice.min;
                this.value.max = roundedPrice.max;
                this.updateFormattedPrice();
            };
            Price.prototype.setPriceRange = function (obj) {
                var roundedPrice = roundingPrice(obj.min, obj.max);
                this.priceRange = {
                    min: roundedPrice.min,
                    max: roundedPrice.max
                }
            };
            Price.prototype.updateFormattedPrice = function () {
                this.formattedMin = convertToPriceWithSpaces(this.value.min);
                this.formattedMax = convertToPriceWithSpaces(this.value.max);
            };
            Price.prototype.updatePrice = function () {
                this.value.min = convertToPriceWithoutSpaces(this.formattedMin);
                this.value.max = convertToPriceWithoutSpaces(this.formattedMax);
                if (this.value.min * 1 > this.value.max * 1) this.value.min = this.value.max;
                if (this.value.min * 1 > this.priceRange.max) this.value.min = this.priceRange.max;
                if (this.value.max * 1 > this.priceRange.max) this.value.max = this.priceRange.max;
                this.updateFormattedPrice();
            };

            params.price = Price;

            params.rooms = Rooms;

            function Rooms(params) {
                AbstractParam.call(this, params);
                this.value = [];
                var paramFromUrl = this.paramFromUrl.split('and');
                for (var i = 0; i < paramFromUrl.length; i++) {
                    var roomNum = paramFromUrl[i];
                    this.value[roomNum] = roomNum * 1;
                }
            }

            Rooms.prototype = Object.create(AbstractParam.prototype);
            Rooms.prototype.getUrl = function () {
                return _.compact(this.value).join('and');
            };
            Rooms.prototype.isNotNull = function () {
                return !!_.compact(this.value).length;
            };
            Rooms.prototype.getDataForRequest = function () {
                return _.compact(this.value);
            };
            Rooms.prototype.setToNull = function () {
                this.value.length = 0;
            };

            params.metro = Metro;

            function Metro(params) {
                ListParam.call(this, params);
                this.tags = [];
                this.oldLength = 0;
            }

            Metro.prototype = Object.create(ListParam.prototype);
            Metro.prototype.createTags = function (metros) {
                var self = this;
                if (!self.tags.length && metros && metros.length) {
                    angular.forEach(this.value, function (id) {
                        var metro = _.find(metros, {id: id}) || _.find(metros, {id: parseInt(id)});
                        self.tags.push(metro);
                        self.oldLength++;
                    });
                }
            };
            Metro.prototype.clear = function () {
                this.tags.length = 0;
                this.value.length = 0;
                this.oldLength = 0;
            };
            Metro.prototype.getAllMetrosWithName = function (name, metros) {
                var arr = [];
                angular.forEach(metros, function (metro) {
                    if (metro.name == name) {
                        arr.push(metro);
                    }
                });
                return arr;
            };
            Metro.prototype.setAllMetrosWithName = function (name, metros) {
                var self = this;
                angular.forEach(metros, function (metro) {
                    if (metro.name == name) {
                        self.value.push(metro.id);
                    }
                });
                self.value = _.uniq(self.value);
            };

            return params;
        })(paramsConstructors);

        searchParams.build();
        return searchParams;
    }];
});