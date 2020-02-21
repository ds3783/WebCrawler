const path = require('path');
const fs = require('fs');


const EventEmitter = require('events').EventEmitter;
const NestiaWeb = require('nestia-web');
const PageFactory = require('../browser/pageFactory');
const utils = require('./utils');
const JobDesc = require('./jobDesc');
const StatusShot = require('./diagnostic/statusShot');

let eventEmitter = new EventEmitter();
const JOB_TIMEOUT = 600 * 1e3;
const JOB_NETWORK_TIMEOUT = 3 * 1e3;
const MAX_DAMA_TIMES = 3;
const MAX_CRACK_TIMES = 3;

const capchaResove = require('./capchaResolve');

let id = 0;
let snapshotPath;

let nextId = function () {
    "use strict";
    return ++id;
};

let getWorkDir = function () {
    "use strict";
    let today = new Date();
    let datePath = '' + today.getFullYear() + utils.fillZero(today.getMonth() + 1, 2) + utils.fillZero(today.getDate(), 2);
    let workDir = path.join(snapshotPath, datePath);

    if (!fs.existsSync(workDir)) {
        fs.mkdirSync(workDir, {recursive: true});
    }
    return workDir;
};

async function cleanJob(job, page) {
    "use strict";

    await PageFactory.releasePage(job, page);

}


function callback(job, success, message, ignoreResult, ignoreUrl) {
    "use strict";

    NestiaWeb.logger.info('Crack done, result :' + success + ' message:' + message);
    if (success) {
        eventEmitter.emit('success', job);
    } else {
        eventEmitter.emit('fail', job);
    }

}

async function resolveCaptcha(id) {
    "use strict";
    return await capchaResove.resolve('dama2', path.join(getWorkDir(), id + '.png'));
}

let letsDoIt = async function (job) {
    job.crackTime = 0;
    const page = await PageFactory.getPage(job);
    // await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36');
    //
    // await page.setViewport({width: 1440, height: 900});
    let reqInterception = true;
    await page.setRequestInterception(true);

    let lastNetworkRequest = +new Date();

    const jobDesc = JobDesc.getDescription(job.type);

    let redirecting = false;
    let registerEvents = function () {
        page.removeAllListeners('load');
        page.removeAllListeners('response');
        page.removeAllListeners('request');
        page.removeAllListeners('console');
        page.on('load', () => {
            NestiaWeb.logger.info(job.id + ':captcha page loaded:');
        });
        page.on('response', (ignoreResponse) => {
            lastNetworkRequest = +new Date();
            /* NestiaWeb.logger.info(job.id + ':captcha response+' + response.url(), response.status);
             if (/distil_r_captcha/.test(response.url())) {
                 console.log(response.url());
             }
             if (redirecting) {
                 // redirecting=false;
             }*/
        });
        page.on('request', (request) => {
            let result = true, reqUrl = request.url();
            if (!reqUrl.match(/:\/\/([^\/]+)\//)) {
                return false;
            }
            if (reqUrl.match(/ga\d+.js/)) {
                return false;
            }
            // NestiaWeb.logger.info(job.id + ':captcha request+' + reqUrl, request.headers, result);
            lastNetworkRequest = +new Date();
            let promise;
            if (reqInterception) {
                if (result) {
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
                    let lastIdx;
                    if ((lastIdx = reqUrl.lastIndexOf('@')) >= 0) {
                        let subStr = reqUrl.substr(lastIdx + 1);
                        try {
                            JSON.parse(decodeURIComponent(subStr));
                            reqUrl = reqUrl.replace('@' + subStr, '');
                        } catch (e) {
                        }
                    }
                    if (page.__context.key !== 'no-proxy' && !/^proxy_direct/.test(page.__context.key)) {
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
                    promise = request.response('');
                }

            } else {
                let isHttps = /^https:\/\//.test(reqUrl);
                let headers = Object.assign({}, request.headers, {
                    "X-Referer": page.__context.url,
                    "X-Proxy-Server": page.__context.proxy_host,
                    "X-Proxy-Port": page.__context.proxy_port,
                    "X-Proxy-Https": isHttps ? '1' : '0',
                });
                if (page.__context.key !== 'no-proxy' && !/^proxy_direct/.test(page.__context.key)) {
                    promise = request.continue(
                        {
                            url: isHttps ? reqUrl.replace(/^https:/, 'http:') : reqUrl,
                            headers: headers
                        }
                    );
                } else {
                    promise = request.continue();
                }
            }
            page.evaluate((viewport) => {
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
            }, page.__context.viewport).catch((e) => {
                NestiaWeb.logger.error('Error fake resolution:' + e.message, e);
            });
            promise.catch(function (e) {
                NestiaWeb.logger.error('Error control request[' + reqUrl + '] on page[' + page.__context.url + '],message: ' + e.message, e);
            });
        });
        page.on('console', (c) => {
            NestiaWeb.logger.info(job.id + ':captcha console+' + c);
        });
    };
    registerEvents();


    let busy = false, interval = null;
    let timeout = setTimeout(function () {
        busy = false;
        (async function () {
            NestiaWeb.logger.info('Job timeout:' + JSON.stringify(job, null, ''));
            let url = await page.url();
            callback(job, false, 'timeout', null, url);
            clearInterval(interval);
            await cleanJob(job, page);
        })();
    }, JOB_TIMEOUT);

    try {
        job.status = 'starting';
        NestiaWeb.logger.info('Captcha starting:' + JSON.stringify(job, null, ''));
        await page.goto(job.url, {waitUntil: 'networkidle0'});
        job.status = 'started';
        NestiaWeb.logger.info('Captcha started:' + JSON.stringify(job, null, ''));
    } catch (e) {
        NestiaWeb.logger.error('Captcha error:' + e.message, e);
        if (!!interval) {
            clearInterval(interval);
        }
        if (!!timeout) {
            clearTimeout(timeout);
        }
        callback(job, false, e.message);
        {
            await page.setViewport({width: 1440, height: 5000});
            let desc = StatusShot.getNewDesc();
            let url = page.url();
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
        }
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
            let redirect = await page.evaluate(() => {
                var redirectMeta = document.head.querySelector('meta[http-equiv=refresh]');
                if (redirectMeta) {
                    return redirectMeta.content;
                } else {
                    return '';
                }
            });
            if (/url=.*$/.test(redirect) && !redirecting) {
                let match = redirect.match(/url=(.*)$/);
                let url = decodeURIComponent(match[1]);
                if (!/^http(s)?:\/\//.test(url)) {
                    match = job.url.match(/^(http(s)?:\/\/[^\/]+)/);
                    url = match[1] + url;
                }
                await page.evaluate(url => {
                    "use strict";
                    location.href = url;
                }, url);
                redirecting = true;
                busy = false;
                return;
            }

            if (usedTime > JOB_NETWORK_TIMEOUT) {
                let result = await page.evaluate(() => {
                    return !!document.getElementById('recaptcha_image');
                });
                NestiaWeb.logger.info(job.id + ':page recaptcha_image:' + result);
                if (result && job.crackTime > MAX_CRACK_TIMES) {
                    NestiaWeb.logger.info(job.id + ':captcha max crack times reached!,exit,fail!');
                    clearTimeout(timeout);
                    clearInterval(interval);

                    callback(job, false, 'Resolve captcha failed,max times exceed!');
                    busy = false;
                    await cleanJob(job, page);
                    return;
                }
                if (result) {
                    job.status = 'finishing';
                    let result = '';
                    if (busy) {
                        NestiaWeb.logger.info(job.id + ':page test success');
                        let id = utils.fillZero(nextId(), 4);
                        await page.screenshot({
                            path: path.join(getWorkDir(), id + '.png'),
                            type: 'png',
                            clip: {x: 568, y: 258, width: 300, height: 60}
                        });
                        NestiaWeb.logger.info(job.id + ':captcha Saved to :' + id + '.png');
                        // captcha crack
                        let checkTimes = MAX_DAMA_TIMES;

                        let captchaTxt = null;
                        while (checkTimes > 0 && (!captchaTxt || typeof captchaTxt !== 'string' || captchaTxt === 'undefined')) {
                            NestiaWeb.logger.info('Begin resolve captcha [' + id + '] :' + captchaTxt);
                            captchaTxt = await resolveCaptcha(id);
                            NestiaWeb.logger.info('Resolve captcha [' + id + '] :' + captchaTxt);
                            checkTimes--;
                        }

                        NestiaWeb.logger.info('Resolve captcha success [' + id + '] :' + captchaTxt);
                        if (!captchaTxt || typeof captchaTxt !== 'string' || captchaTxt === 'undefined') {
                            NestiaWeb.logger.error('Resolve captcha failed :' + id);

                            clearTimeout(timeout);
                            clearInterval(interval);

                            callback(job, false, 'Resolve captcha failed', captchaTxt);
                            await cleanJob(job, page);
                        } else {
                            captchaTxt = captchaTxt.trim();
                            job.crackTime++;
                            reqInterception = false;
                            // await page.setRequestInterceptionEnabled(reqInterception);
                            NestiaWeb.logger.error('Resolve captcha setting :' + id);
                            await page.evaluate((captcha) => {
                                document.getElementById('recaptcha_response_field').value = captcha;
                                document.getElementById('dCF_input_complete').click();
                            }, captchaTxt);
                        }
                        lastNetworkRequest = +new Date();
                        busy = false;
                        return;
                    }
                    if (busy) {
                        NestiaWeb.logger.info(job.id + ':page get html:');
                        let url = await page.url();
                        callback(job, true, null, result, url);
                    }
                    job.status = 'finished';
                    if (busy) {
                        await cleanJob(job, page);
                    }
                    return;
                }


                result = await jobDesc.validateSuccess(page, job);

                if (result) {
                    if (busy) {
                        NestiaWeb.logger.info(job.id + ':captcha crack success!');
                        callback(job, true);
                        clearTimeout(timeout);
                        clearInterval(interval);
                        await cleanJob(job, page);
                    }
                } else {
                    let url;
                    if (busy) {
                        NestiaWeb.logger.info(job.id + ':page test fail');
                        clearTimeout(timeout);
                        clearInterval(interval);
                        // result = await jobDesc.getResult(page, job);
                    }
                    if (busy) {
                        url = await page.url();
                        NestiaWeb.logger.info(job.id + ':page failed with unknown error');
                        callback(job, false, 'Unknown error,browser didn\'t get result,maybe type is wrong?', null, url);
                    }
                    if (busy) {
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
                    }
                    job.status = 'finished';
                    if (busy) {
                        await cleanJob(job, page);
                    }
                }
            }
            busy = false;
        })();

    }, 50);
};

module.exports = {
    init: function () {
        "use strict";
        snapshotPath = NestiaWeb.manifest.get('captchaPath');
        let workingDir = getWorkDir();
        let files = fs.readdirSync(workingDir);
        for (let file of files) {
            let match;
            if (match = file.match(/^(\d+)\.png/)) {
                let fileid = match[1] * 1;
                if (!isNaN(fileid)) {
                    id = Math.max(id, fileid);
                }
            }
        }
    },
    crack: function (ctx) {
        "use strict";
        return letsDoIt(ctx);
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

