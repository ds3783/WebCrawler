const path = require('path');
const NestiaWeb = require('nestia-web');
const EventEmitter = require('events').EventEmitter;
const PageFactory = require('../browser/pageFactory');
const Browser = require('../browser');
const Luminati = require('../browser/LuminatiProxy');
const StatusShot = require('./diagnostic/statusShot');
const JobDesc = require('./jobDesc');
const utils = require('./utils');
const JOB_TIMEOUT = 60 * 1e3;
const JOB_NETWORK_TIMEOUT = 6e3;

let jobs = [];

let callbackRegistration = {};

let eventEmitter = new EventEmitter();

const defaultJob = {
    id: -1,
    url: '',
    status: 'init',
    runtime: 1
};

async function callback(job, page, success, message, result, url) {
    "use strict";
    let ret = {
        result: success,
        message: message || '',
        data: result || '',
        url: url || ''
    };
    if (typeof success === 'object') {
        ret.result = false;
        ret = Object.assign(ret, success);
    }
    const jobDesc = JobDesc.getDescription(job.type);
    if (jobDesc && typeof jobDesc.onCallback === 'function') {
        let result = await jobDesc.onCallback(ret, job);
        if ((!ret.result) && page.__context.proxyProvider === 'LUMINATI') {
            NestiaWeb.logger.info(`Job failed, try switch Luminati IP on [${job.proxy_host}, ${job.proxy_port}]`);
            Luminati.changeProxy(job.proxy_host, job.proxy_port).then((res) => {
                NestiaWeb.logger.info(`success on switch Luminati IP [${job.proxy_host}, ${job.proxy_port}]`, res.raw);
            }).catch((e) => {
                NestiaWeb.logger.info(`failing on switch Luminati IP [${job.proxy_host}, ${job.proxy_port}], error:` + e.message, e);
            })
        }
        switch (result) {
            case'CLOSE_BROWSER':
                if (page) {
                    let BrowserFactory = Browser.getBrowserFactory();
                    await BrowserFactory.markUnavailable(page.__context.key, page.__context.id);
                }
                break;
            case'CLEAR_COOKIE':
                if (page) {
                    NestiaWeb.logger.info(`Clearing browser cookie [${job.proxy_host}, ${job.proxy_port}] [${page.__context.key}] [${page.__context.id}]`);
                    await page._client.send('Network.clearBrowserCookies');
                }
                break;
            default:
                break;

        }
    }
    if (job.sync && typeof callbackRegistration[job.id] === 'function') {
        callbackRegistration[job.id](ret);
    }
}

async function cleanJob(job, page) {
    "use strict";
    if (callbackRegistration[job.id]) {
        delete callbackRegistration[job.id];
    }
    if (job.useStaticBrowser) {
        await PageFactory.releaseStaticPage(page);
    } else {
        await PageFactory.releasePage(job, page);
    }

    let idx = jobs.indexOf(job);
    if (idx >= 0) {
        jobs.splice(idx, 1);
    }
}

async function doJob(job, ctx) {
    "use strict";
    ctx = ctx || {};
    job.startTime = +new Date();
    job.status = 'prepare';
    const jobDesc = JobDesc.getDescription(job.type);
    jobDesc.initialJob && jobDesc.initialJob(job);
    let page = ctx.page;
    if (!page) {
        if (job.useStaticBrowser) {
            page = await PageFactory.getStaticPage(job.useStaticBrowser);
        }
        if (!job.useStaticBrowser || !page) {
            job.useStaticBrowser = null;
            page = await PageFactory.getPage(job);
        }

    }
    // await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36');
    //
    // await page.setViewport({width: 1440, height: 900});
    await page.setRequestInterception(true);

    let lastNetworkRequest = +new Date(), networking = {};
    let registerEvents = function () {

        page.on('load', async () => {
            NestiaWeb.logger.info(job.id + ':page loaded:');
        });
        page.on('response', async (response) => {
            try {
                /**/
                /*lastNetworkRequest = +new Date();
                if (cookies.length > 0) {
                    await page.setCookie.apply(page, cookies);
                }*/
                let responseUrl = response.url();
                lastNetworkRequest = +new Date();
                if (networking.hasOwnProperty(responseUrl)) {
                    networking[responseUrl]--;
                    if (networking[responseUrl] <= 0) {
                        delete networking[responseUrl];
                    }
                }

                if (typeof jobDesc.responseFilter === 'function') {
                    try {
                        let responseContent = await response.text();

                        let result = await jobDesc.responseFilter(response, responseContent);
                        NestiaWeb.logger.info('FILTER ', responseUrl, 'filter Result', result, 'status', response.status(), typeof response.status(), (responseContent && responseContent.substr(0, 300)));
                        if (/^http[s]?:\/\/[^\/]+\/ga\d+.js/.test(responseUrl)) {
                            NestiaWeb.logger.info('GA-JS ', responseUrl, 'filter Result', result, 'status', response.status(), typeof response.status(), (responseContent && responseContent.substr(0, 300)));
                        }
                        switch (result) {
                            case 'RELOAD':
                                NestiaWeb.logger.info(job.id + ':page failed, RELOAD ,clear cookie!');
                                let cookies = [], headers = response.headers;
                                for (let i in headers) {
                                    if (i === 'set-cookie' && headers.hasOwnProperty(i)) {
                                        cookies = cookies.concat(utils.parseCookies(headers[i]));
                                    }
                                }
                                try {
                                    await page.deleteCookie.apply(page, cookies);
                                } catch (e) {
                                    NestiaWeb.logger.error('Error delete cookies:' + e.message, cookies, e);
                                }
                                process.nextTick(function () {
                                    clearTimeout(timeout);
                                    clearInterval(interval);
                                    page.removeAllListeners('load');
                                    page.removeAllListeners('request');
                                    page.removeAllListeners('response');
                                    doJob(job, {page: page});
                                });
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
        page.on('request', async (request) => {
            let reqUrl = request.url(), lastIdx;
            lastNetworkRequest = +new Date();
            let pass = jobDesc.requestFilter ? jobDesc.requestFilter(request) : true;
            let promise;
            if (pass) {
                if (networking.hasOwnProperty(reqUrl)) {
                    networking[reqUrl]++;
                } else {
                    networking[reqUrl] = 1;
                }

                /*
                * {
                    headers: {
                        "X-Referer": page.__context.url,
                        "X-Proxy-Server": page.__context.proxy_host,
                        "X-Proxy-Port": page.__context.proxy_port,
                    }
                }*/
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

                if (page.__context.useLocalProxy) {
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
            /*page.evaluate((viewport) => {
                window.__defineGetter__('innerWidth', function () {
                    return viewport.width;
                });
                window.__defineGetter__('innerHeight', function () {
                    return viewport.height;
                });
                window.__defineGetter__('outerWidth', function () {
                    return viewport.width;
                });
                window.__defineGetter__('outerHeight', function () {
                    return viewport.height;
                });
                screen.__defineGetter__('width', function () {
                    return viewport.width;
                });
                screen.__defineGetter__('availWidth', function () {
                    return viewport.width;
                });
                screen.__defineGetter__('height', function () {
                    return viewport.height;
                });
                screen.__defineGetter__('availHeight', function () {
                    return viewport.height;
                });
                navigator.__defineGetter__('webdriver', function () {
                    return window.undefined;
                });
            }, page.__context.viewport).catch((e) => {
                NestiaWeb.logger.error('Error fake resolution:' + e.message, e);
            });*/
            // NestiaWeb.logger.debug(job.id + ':page request+' + reqUrl);
        });
    };

    registerEvents();
    /*page.on('console', (c) => {
        // NestiaWeb.logger.info(job.id + ':page console+' + c);
    });*/

    let busy = false, interval = null;
    let timeout = setTimeout(function () {
        job.status = 'timeout-end';
        busy = false;
        (async function () {
            NestiaWeb.logger.info('Job timeout:' + JSON.stringify(job, null, ''));
            let url = await page.url();
            await callback(job, page, false, 'timeout', null, url);
            clearInterval(interval);
            await cleanJob(job, page);
        })();
    }, JOB_TIMEOUT);

    try {
        job.status = 'starting';
        NestiaWeb.logger.info('Job inited:' + JSON.stringify(job, null, ''));
        await jobDesc.setPageContext(page);
        NestiaWeb.logger.info('Job starting:' + JSON.stringify(job, null, ''));
        let navigateOptions = (jobDesc.getNavigateOptions && jobDesc.getNavigateOptions(job)) || {waitUntil: 'networkidle0'};
        await page.goto(job.url, navigateOptions);
        job.status = 'started';
        NestiaWeb.logger.info('Job started:' + JSON.stringify(job, null, ''));
    } catch (e) {
        NestiaWeb.logger.error('Job error:' + e.message, e);
        if (!!interval) {
            clearInterval(interval);
        }
        if (!!timeout) {
            clearTimeout(timeout);
        }
        await callback(job, page, false, e.message);
        await cleanJob(job, page);
        return;
    }


    interval = setInterval(function () {
        if (busy) {
            return;
        }
        busy = true;
        (async function () {
            //test

            let usedTime = +new Date() - lastNetworkRequest;
            let waitForNetIdle = (jobDesc.waitForNetIdle && jobDesc.waitForNetIdle());
            if (typeof waitForNetIdle === 'undefined') {
                waitForNetIdle = true;
            }
            if ((waitForNetIdle && usedTime > JOB_NETWORK_TIMEOUT && Object.keys(networking).length === 0) || (!waitForNetIdle)) {
                let validResult = await jobDesc.validateSuccess(page, job);
                if (validResult) {
                    job.status = 'finishing';
                    let result = '';
                    if (busy) {
                        NestiaWeb.logger.info(job.id + ':page test success');
                        clearTimeout(timeout);
                        clearInterval(interval);
                        result = await jobDesc.getResult(page, job);
                    }
                    if (busy) {
                        NestiaWeb.logger.info(job.id + ':page get html:');
                        let url = await page.url();
                        await callback(job, page, validResult, null, result, url);

                    }
                    job.status = 'finished';
                    if (busy) {
                        await cleanJob(job, page);
                    }
                    return;
                }

                {
                    let url = await page.url();
                    let captcha = await jobDesc.validateCaptcha(page, job);
                    let cleanMess = false;

                    if (busy) {
                        if (captcha) {
                            if (typeof jobDesc.crackCaptcha === 'function') {
                                cleanMess = await jobDesc.crackCaptcha(page);
                                job.captchaedTimes++;
                            } else {
                                //mark browser unavailable
                                let BrowserFactory = Browser.getBrowserFactory();
                                await BrowserFactory.markUnavailable(page.__context.key, page.__context.id);
                                job.captchaedTimes++;
                                cleanMess = true;
                            }
                            if (cleanMess) {
                                await callback(job, page, false, 'Captcha required, craw too fast?', null, url);
                            }
                        } else {
                            NestiaWeb.logger.info(job.id + ':page failed with unknown error');
                            NestiaWeb.logger.info(job.id + ':networking:' + Object.keys(networking).length, networking);
                            await callback(job, page, false, 'Unknown error,browser didn\'t get result,maybe type is wrong?', null, url);

                            //WRITE LOG AND SAVE SCREEN CAPTURE
                            await page.setViewport({width: 1440, height: 5000});
                            let desc = StatusShot.getNewDesc();
                            let screenShotName = desc.id + '.jpg';
                            await page.screenshot({
                                path: path.join(desc.path, screenShotName),
                                type: 'jpeg',
                                quality: 65
                            });
                            let cookies = await page.cookies();
                            let html = await page.evaluate(() => {
                                return document.documentElement.outerHTML;
                            });
                            StatusShot.save(desc, job, url, cookies, html, screenShotName);
                            NestiaWeb.logger.info(job.id + ':  screenshot saved!', desc);
                            cleanMess = true;
                        }


                    }

                    if (cleanMess) {
                        job.status = 'finished';
                        clearTimeout(timeout);
                        clearInterval(interval);
                        await cleanJob(job, page);
                    }
                }
            }
            busy = false;
        })();

    }, 50);


}


module.exports = {
    listJobs: function () {
        "use strict";
        return jobs;
    },
    startJob: function (context, domainStatus) {
        "use strict";
        let job = Object.assign({}, defaultJob, context);
        jobs.push(job);
        if (domainStatus) {
            return new Promise((resolve, ignoreReject) => {
                callback(job, null, false, 'captcha is requiring,plz wait').then(() => {
                    resolve();
                });
            });
        } else {
            job.captchaedTimes = 0;
            return doJob(job);
        }
    },
    registerCallback: function (jobId, callback) {
        "use strict";
        if (!callbackRegistration[jobId]) {
            callbackRegistration[jobId] = callback || function () {
            };
        } else {
            throw new Error('callback already registered, jobId:' + jobId);
        }
    },
    unregisterCallback: function (jobId) {
        "use strict";
        if (callbackRegistration[jobId]) {
            delete callbackRegistration[jobId];
        }
    },
    generateId: function () {
        "use strict";
        let maxId = 0;
        for (let job of jobs) {
            if (typeof job.id === 'number') {
                maxId = Math.max(maxId, job.id);
            }
        }
        return maxId + 1;
    },
    on: function (type, listener) {
        "use strict";
        eventEmitter.on(type, listener);
    },
    removeListener: function (type, listener) {
        "use strict";
        eventEmitter.removeListener(type, listener);
    }

};