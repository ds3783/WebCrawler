const fs = require('fs');
const path = require('path');

/*movie info demo:*/

const MovieInfoDemo = {
    "title": "Disney/Pixar`s Toy Story 4",
    "cover": "https://ngsprodstorage1.blob.core.windows.net/prd/content/images/movie/default/en-sg/Poster-ToyStory4-2019-V2.jpg",
    "mpaaRating": "PG",
    "cinema": "Shaw Theatres Lido  Hall 1",
    "time": "2019-06-28T11:00:00.000Z",
    "expireTime": new Date()
};

/*Seats  demo*/
const SeatsDemo = {
    "rows": 4,
    "columns": 20,
    "seats": [
        [
            {
                row: 0,
                col: 0,
                type: 'NONE|EMPTY|SELECTED|SOLD|UNAVAILABLE',
                rowName: 'A',
                colName: '10',
                id: 'LIDO1_SD_EL0373',
            },
        ],
    ]
};

let defaultFunctions = {
    init: async function () {
        await this.page.setRequestInterception(true);
        this.page.on('response', async (response) => {
            try {
                /**/
                /*lastNetworkRequest = +new Date();
                if (cookies.length > 0) {
                    await page.setCookie.apply(page, cookies);
                }*/
                let responseUrl = response.url();


                if (typeof this.responseFilter === 'function') {
                    try {
                        let responseContent = await response.text();

                        let result = await this.responseFilter(response, responseContent);
                        NestiaWeb.logger.info('FILTER ', responseUrl, 'filter Result', result, 'status', response.status(), typeof response.status(), (responseContent && responseContent.substr(0, 300)));
                        switch (result) {
                            case 'RELOAD':
                                //TODO::
                                break;
                            default:
                                //DO nothing
                                break;
                        }
                    } catch (e) {
                        if (/No resource with given identifier found/.test(e.message)) {
                            //https://github.com/Siteimprove/alfa/issues/85

                        }
                    }
                }
            } catch (e) {
                NestiaWeb.logger.error(e.message, e);
            }

            // if (/^http(s)?:\/\//.test(response.headers['location'])) {
            //    page.goto(response.headers['location']);
            // }
            // NestiaWeb.logger.info(job.id + ':page response+' + request.url());
        });
        this.page.on('request', async (request) => {
            let reqUrl = request.url(), lastIdx;
            let pass = this.requestFilter ? this.requestFilter(request) : true;
            let promise;
            if (pass) {
                /*
                * {
                    headers: {
                        "X-Referer": page.__context.url,
                        "X-Proxy-Server": page.__context.proxy_host,
                        "X-Proxy-Port": page.__context.proxy_port,
                    }
                }*/
                let page = this.page;
                let isHttps = /^https:\/\//.test(reqUrl), isOriginHttps = /^https:\/\//.test(page.__context.url);
                if (isOriginHttps) {
                    isHttps = true;
                }
                let extraHeaders = {
                    "X-Accept-Language": page.__context.acceptLanguage,
                    "X-User-Agent": page.__context.ua,
                    "X-Referer": page.__context.url,
                    "X-Origin": page.__context.url.replace(/^(http[s]?:\/\/[^\/]+).*$/, '$1'),
                    "X-Proxy-Server": page.__context.proxy_host,
                    "X-Proxy-Port": page.__context.proxy_port,
                    "X-Proxy-Https": isHttps ? '1' : '0',
                };
                let headers = Object.assign({}, request.headers(), extraHeaders);
                if ((lastIdx = reqUrl.lastIndexOf('@')) >= 0) {
                    let subStr = reqUrl.substr(lastIdx + 1);
                    try {
                        JSON.parse(decodeURIComponent(subStr));
                        reqUrl = reqUrl.replace('@' + subStr, '');
                    } catch (e) {
                    }
                }
                if (page.__context.useLocalProxy && !/cloudflare/.test(reqUrl)) {
                    promise = request.continue(
                        {
                            url: (isHttps ? reqUrl.replace(/^https:/, 'http:') : reqUrl) + '@' + encodeURIComponent(JSON.stringify(extraHeaders)),
                            headers: headers
                        }
                    );
                } else {
                    promise = request.continue();
                }
            } else {
                promise = request.abort();
            }


            promise.catch(function (e) {
                NestiaWeb.logger.error('Error control request[' + reqUrl + '] on page[' + page.__context.url + '],message: ' + e.message, e);
            });

        });
    },
    start: async function (sessionParam) {

    },
    getMovieInfo: async function () {
        return {};
    },
    getTicketLimit: function () {
        //6 shaws  20 gv 10 cathay
        return 6;
    },
    getSeats: async function () {
        return {};
    },
    selectSeats: async function (seats) {
        return {};
    },
    executePayment: async function () {
        return {};
    },
    close: function () {

    }
};

let SESSION_IMPLEMENTS = {};
let dir = __dirname;
let files = fs.readdirSync(path.join(dir, 'cinemaImpl'));
for (let file of files) {
    let fullPath = path.join(dir, 'cinemaImpl', file);
    let impl = require(fullPath);
    SESSION_IMPLEMENTS[impl.cinema] = impl.impl;
}


module.exports = function (params) {
    let session = function (params) {
        if (params) {
            for (var k in params) {
                this[k] = params[k];
            }
        }
    };
    let impl = SESSION_IMPLEMENTS[params.cinema] || {};
    session.prototype = Object.assign({}, defaultFunctions, impl);
    let result = new session(params);
    result.init();
    return result;
};