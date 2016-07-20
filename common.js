var slonComponents = angular.module('slon.components', []);
slonComponents.run(function($rootScope){});

slon = (function() {
    var scope = {};
    scope.session = {"city":124,"lang":"ru"};
    scope.config = {"country":"ru","lang":"ru","phoneCode":"+7","currency":"rub","project":"67250f987ac36393b777d36ab676afd4",
        "apiUrl":"https://api.33slona.ru","cdnUrl":"https://cdn.33slona.net","tokenKey":"slonAT",
        "ad":{"images":{"useCropping":false,"minWidth":640,"minHeight":480,"maxWeight":10}},"defaultLang":"ru"};
    scope.options = {"photoFinishDate":"30 июня 2016"};
    scope.seo = [];

    return scope;
})();

slon.config.ignoreSeoKey = 'all';

slon.regs = {
    "phone" : new RegExp('^\\' + slon.config.phoneCode + ' \\(\\d{3}\\) \\d{3}\\-\\d{4}$'),
    "phoneMask" : slon.config.phoneCode + ' (999) 999-9999',
    validEmail : /^[-\w.+_]+@[-\w.+_]+\.[a-z]{2,4}$/i,
    validPhone : /^(8|7|\+7|\+1){0,1}9[0-9]{9}$/
};

slon.detectDevice = function (){
    var media,
        viewport = $(document.body),
        orientation = (window.matchMedia('(orientation : landscape)').matches && 'landscape') ||
            (window.matchMedia('(orientation : portrait)').matches && 'portrait'),
        supportTouch = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);

    var desktop = {name : 'desktop', supportTouch : supportTouch, 'orientation' : orientation};

    if (viewport.width() >= 960 || !slon.config.media) return desktop;

    for (var device in slon.config.media) {
        if (slon.config.media.hasOwnProperty(device) && (media = slon.config.media[device].media)){
            if (window.matchMedia(media).matches) {
                slon.config.media[device].name = device;
                slon.config.media[device].supportTouch = supportTouch;
                slon.config.media[device].orientation = orientation;
                return slon.config.media[device];
            }
        }
    }

    return desktop;
};

function medialang(params){
    function processStringField(splittedString, stringProcessor, wordNum) {
        if (wordNum.lastIndexOf(',') !== -1) {
            var wordNums = wordNum.split(',');
            var exp = stringProcessor[wordNum];
            delete stringProcessor[wordNum];
            for (var i = 0; i < wordNums.length; i++) {
                stringProcessor[wordNums[i]] = exp;
                processStringField(splittedString, stringProcessor, wordNums[i]);
            }
        }
        else if (typeof (wordNum * 1) === 'number') {
            var str = splittedString[wordNum];
            var processParams = stringProcessor[wordNum];
            switch (processParams.substr(0, 1)) {
                case '+':
                    str = str + processParams.substr(1);
                    break;
                case '=':
                    str = processParams.substr(1);
                    break;
                case '-':
                    var substrParams;
                    if (typeof (substrParams = (processParams.substr(1) * 1)) === 'number' && substrParams) {
                        str = str.substr(substrParams);
                    }
                    else {
                        str = '';
                    }
                    break;
            }
            splittedString[wordNum] = str;
        }
    }

    var keys = Object.keys(params);
    var obj = {};
    for (var i = 0; i < keys.length; i++) {
        var deviceName = keys[i];
        var val = params[deviceName],
            completedString;

        if (deviceName.substr(0,1) === '&' && typeof val === 'object'){
            try{
                deviceName = deviceName.substr(1);
                var splittedSourceString = params['desktop'].split(' ');
                for (var wordNum in val) {
                    if (val.hasOwnProperty(wordNum)){
                        processStringField(splittedSourceString, val, wordNum);
                    }
                }
                completedString = _.compact(splittedSourceString).join(' ');
            }
            catch(e){
                console.error(e);
            }
        }
        else{
            completedString = val;
        }

        var devices = deviceName.split('@');
        for (var j = 0; j < devices.length; j++) {
            obj[devices[j]] = completedString;
        }
    }

    return switchWhenDevice(obj);
}

function isDevice(d){
    var devices;
    if (!Array.isArray(d)){
        devices = [d];
    }
    else{
        devices = d;
    }

    for (var i = 0; i < devices.length; i++) {
        if (slon.session.device.name === devices[i]){
            return true;
        }
    }

    return false;
}

function isTouchDevice(){
    return slon.session.device.supportTouch;
}

function switchWhenDevice(obj){
    var property = obj[slon.session.device.name];
    return property !== undefined ? property : obj['desktop'];
}

/**
 * Zendesk
 */
function setZendeskData(){
    var currentUser = localStorage['ls.currentUser'];
    if (currentUser){
        currentUser = JSON.parse(currentUser);
        if (window.zE){
            zE(function() {
                zE.identify({
                    name: currentUser.fullname,
                    email: currentUser.email,
                    externalId: currentUser.id
                });
            });
        }
    }
}

//setZendeskData();

/**
 * Браузер пользователя
 * @returns {string}
 */
var getSlonBrowser = function(){
    // получаем данные userAgent
    var ua = navigator.userAgent;
    // с помощью регулярок проверяем наличие текста,
    // соответствующие тому или иному браузеру
    if (ua.search(/Chrome/) > 0) return 'Google Chrome';
    if (ua.search(/Firefox/) > 0) return 'Firefox';
    if (ua.search(/Opera/) > 0) return 'Opera';
    if (ua.search(/Safari/) > 0) return 'Safari';
    if (ua.search(/MSIE/) > 0 || ua.search(/Trident/) > 0) return 'Internet Explorer';
    // условий может быть и больше.
    // сейчас сделаны проверки только
    // для популярных браузеров
    return undefined;
};

slon.session.browser = getSlonBrowser();

if (slon.session.browser === 'Internet Explorer') $('html').addClass('ie');

function isoStrToDate (input) {
    var temp;
    return (temp = new Date(input.replace(/(\d+)-(\d+)-(\d+)/, '$2/$3/$1'))) != 'Invalid Date'? temp : 0;
}

function dirtyStringToNumber (string) {
    if (!string) return 0;
    if (typeof string !== 'string') return string;
    return string.replace(/,/g,".") * 1;
}

slon.log = function() {
    if(slon.isDebug) {
        var a = [].slice.call(arguments);
        a.unshift(' ' + (slon.log.caller.name ? slon.log.caller.name : 'anon') + ' >>');
        console.trace.apply(console, a);
    }
};
slon.getRealType = function (n){
    return (n === null && 'null') && (Array.isArray(n) && 'array') || typeof n;
};
/** Обработчик RGB цвета ('#xxxxxx'), для затемнения (only!)
 * мультиплексор должен быть  0 < multiplexor < 1 */
function rgbColorToDark(color, multiplexor) {
    multiplexor = multiplexor > 1.0 ? 1.0 : (multiplexor < 0.0 ? 0.0 : multiplexor);
    function multHex(c, m) { var cc = (~~(parseInt(c,16)*m)).toString(16); return cc.length > 1 ? cc : '0'+cc; }
    var r = color.slice(1,3), g = color.slice(3,5), b = color.slice(5,7);
    r = multHex(r, multiplexor);
    g = multHex(g, multiplexor);
    b = multHex(b, multiplexor);
    return '#'+r+g+b;
}
/**
 * Оборачивает в тег <b /> совпавшую подстроку
 * @param str  - входная строка
 * @param $query - подстрока для поиска совпадений
 * @returns {*}
 */
function autocomleteBolderSubstr(str, $query) {
    var pos = str.toLowerCase().search($query);
    if(!(pos+1)) return str;
    var len = $query.length;
    return str.slice(0,pos)+'<b>'+str.slice(pos,pos+len)+'</b>'+str.slice(pos+len);
}