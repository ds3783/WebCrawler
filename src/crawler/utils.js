module.exports = {
    getProxyKey: function (context) {
        "use strict";
        if (!context) {
            throw new Error('Invalid context!');
        }
        if (!context.proxy_host || !context.proxy_port) {
            return 'no-proxy';
        } else {
            return 'proxy_' + context.proxy_host + '_' + context.proxy_port;
        }
    },
    getDomain: function (url) {
        "use strict";
        url = url || '';
        let match;
        if (match = url.match(/^http(s)?:\/\/([^\/]+).*$/)) {
            return match[2];
        }
        return '';
    },
    fillZero: function (str, len) {
        "use strict";
        str = '' + str;
        while (str.length < len) {
            str = '0' + str;
        }
        return str;
    },
    utilizeHeaders: function (headers) {
        "use strict";
        let result = {};
        headers = headers || {};
        for (let key in headers) {
            if (headers.hasOwnProperty(key)) {
                let newKey = key.replace(/(^|[^a-zA-Z])([a-z])/g, function (all, dash, letter) {
                    return dash + letter.toUpperCase();
                });
                result[newKey] = headers[key]
            }
        }
        return result;
    },
    parseCookies: function (cookieStr) {
        "use strict";
        let resoveKeyValuePair = function (str) {
            str = str || '';
            let result = {key: '', value: ''};
            let matches = str.match(/^([^=]+)=(.*)$/);
            if (matches) {
                result.key = matches[1];
                result.value = matches[2];
            }
            return result;
        };

        cookieStr = cookieStr || '';
        let result = [];
        let cookies = cookieStr.split('\n');
        for (let cookie of cookies) {


            if (!cookie) {
                continue;
            }
            let cookieObj = {};
            let splited = cookie.split(';');
            for (let i = 0; i < splited.length; i++) {
                if (i === 0) {
                    let pair = resoveKeyValuePair(splited[i]);
                    cookieObj['name'] = decodeURIComponent(pair.key);
                    cookieObj['value'] = decodeURIComponent(pair.value);
                    continue;
                }
                if (/HttpOnly/.test(splited[i])) {
                    cookieObj['httpOnly'] = true;
                } else {
                    let pair = resoveKeyValuePair(splited[i]);
                    switch ((pair.key || '').toLowerCase()) {
                        case 'max-age':
                            cookieObj['expires'] = pair.value * 1;
                            break;
                        case 'path':
                            cookieObj['path'] = pair.value;
                            break;
                        case 'domain':
                            cookieObj['domain'] = pair.value;
                            break;
                    }
                }
            }
            result.push(cookieObj);
        }
        return result;
    }
};