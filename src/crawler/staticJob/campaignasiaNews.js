const path = require('path');
const NestiaWeb = require('nestia-web');
const pageFactory = require('../../browser/pageFactory');
const StatusShot = require('../diagnostic/statusShot');

const Pool = require('../Pool');

const KEY = 'CAMPAIGN_ASIA_NEWS';
const LOG_KEY = '[' + KEY + ']';

const JOB_NETWORK_TIMEOUT = 1e3;
const JOB_TIMEOUT = 60 * 1e3;
const CHECK_TIMEOUT = 120 * 1e3;
const KEEP_ALIVE_TIME = 30 * 60 * 1e3;
const CHECK_PAGE_NAV_TIMEOUT = 60 * 1e3;


const sleep = function (time) {
    return new Promise((resolve => {
        setTimeout(function () {
            resolve();
        }, time);
    }));
};

let ready = false, tabsPool = null;

class JobExecutor {
    constructor(job) {
        this.job = job || {};
        this.result = {};
        this.testedKeywords = {};

    }

    async run() {
        try {
            this.poolItem = await tabsPool.getItem();
        } catch (e) {
            NestiaWeb.logger.error('Error get browser tab:' + e.message, e);
            return {result: false, message: e.message};
        }
        let page = this.poolItem.item;
        let job = this.job;
        let jobUrl = job.url;
        if (/\?/.test(jobUrl)) {
            jobUrl += '&__t=' + Math.random();
        } else {
            jobUrl += '?__t=' + Math.random();
        }
        NestiaWeb.logger.info('fetching: ' + jobUrl);
        page.goto(jobUrl, {
            waitUntil: 'domcontentloaded',
            timeout: CHECK_PAGE_NAV_TIMEOUT
        });


        let testResult = await testPageLoaded(page, async function (page) {
            var domCnt = await page.evaluate(function () {
                return document.querySelectorAll('#main').length;
            });
            return domCnt > 0;
        }, 5);

        if (testResult) {
            let resultStr = await page.evaluate(function () {
                return document.getElementById('main').outerHTML;
            });
            let shorted = resultStr.length > 100 ? resultStr.substr(0, 100) : resultStr;
            this.result.result = true;
            this.result.data = resultStr;
            NestiaWeb.logger.info('StaticJob Complete result:' + testResult + ' data:' + (shorted) + ' ,param:' + JSON.stringify(this.job));
        } else {
            this.result.result = false;
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
            let url = await page.url();
            StatusShot.save(desc, this.job, url, cookies, html, screenShotName);
            this.result.message = 'Unknown error';
            NestiaWeb.logger.info('StaticJob Complete result:' + false + ' message:' + (this.result.message) + ' ,param:' + JSON.stringify(this.job));
        }


        this.finalize(true);
        return this.result;
    }


    finalize(drop) {
        tabsPool.releaseItem(this.poolItem, drop);
    }

}

(function () {

})();


let getElementPosition = async function (page, selector) {
    return await page.evaluate((selector) => {
        var dom = document.querySelector(selector);
        if (dom) {
            var rect = dom.getBoundingClientRect();
            return {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            }
        }
        return null;
    }, selector);
};

let requestFilter = function (page, request) {
    let url = request.url();
    let pass = /^http(s)?:\/\/[^\/]*\.campaignasia\.com(\/.*)?$/.test(url);
    let inBlackList = /\.jpg|\.png/.test(url);
    let promise;
    if (pass && !inBlackList) {
        //!/google|twitter|rubiconproject|fout\.jp|facebook|\.jpg|\.png|\.gif|scorecardresearch|doubleclick|en25\.com|eloqua\.com|survicate\.com|intercom\.io|radar\.cedexis\.com|sb\.scorecardresearch\.com|analytics\.js/.test(url)
        if (page._networking.hasOwnProperty(url)) {
            page._networking[url]++;
        } else {
            page._networking[url] = 1;
        }

        let isHttps = /^https:\/\//.test(url), isOriginHttps = /^https:\/\//.test(page.__context.url);

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

        extraHeaders['X-Connection'] = 'keep-alive';
        extraHeaders['X-Accept-Encoding'] = 'gzip, deflate, br';
        let headers = Object.assign({}, request.headers(), extraHeaders);
        let reqUrl = url, lastIdx;
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
        NestiaWeb.logger.info(' ABORTED: ' + url);
        promise = request.abort();
    }

    promise.catch(function (e) {
        NestiaWeb.logger.error(LOG_KEY + 'Error control request[' + url + '] on page[' + page.__context.url + '],message: ' + e.message, e);
    });
};

let responseFilter = function (page, response) {
    let url = response.url();
    page.lastNetworkRequest = +new Date();
    if (page._networking.hasOwnProperty(url)) {
        page._networking[url]--;
        if (page._networking[url] <= 0) {
            delete page._networking[url];
        }
    }
};

let testPageLoaded = async function (page, validateFunc, netConnLimit) {
    netConnLimit = netConnLimit || 0;
    return new Promise(function (resolve) {
        let timeout = setTimeout(function () {
            page.busy = false;
            (async function () {
                NestiaWeb.logger.info(LOG_KEY + 'Page timeout:' + page.__context.url);
                clearInterval(interval);
                resolve(false);
            })();
        }, JOB_TIMEOUT);
        let interval = setInterval(function () {
            if (page.busy) {
                return;
            }
            page.busy = true;
            (async function () {

                let usedTime = +new Date() - page.lastNetworkRequest;
                // NestiaWeb.logger.warn('chk page', 'timeout', usedTime > JOB_NETWORK_TIMEOUT, 'network:', Object.keys(page._networking).length, Object.keys(page._networking).length > 0 ? Object.keys(page._networking).join('|') : '');
                if (usedTime > JOB_NETWORK_TIMEOUT && Object.keys(page._networking).length <= netConnLimit) {
                    let validResult = await validateFunc(page);
                    if (validResult) {
                        if (page.busy) {
                            NestiaWeb.logger.debug(LOG_KEY + ':page test success');
                            clearInterval(interval);
                            clearTimeout(timeout);
                        }
                        if (page.busy) {
                            NestiaWeb.logger.debug(LOG_KEY + ':page ready:' + page.__context.url);
                            resolve(validResult);
                        }
                    }
                }
                page.busy = false;
            })();

        }, 50);
    });
};


let keepAlivePage;

let checkLogin = function (page) {
    return new Promise(async function (resolve) {
        let checkStartTime = +(new Date());
        let testInterval = setInterval(async function () {
            let loggedIn = await page.evaluate(() => {
                return {
                    login: /\.CAMPAIGNASIAFORMSAUTH=/.test(document.cookie),
                    hasJQ: typeof window.jQuery === 'function',
                }
            });


            if (loggedIn && loggedIn.login) {
                //success
                NestiaWeb.logger.info(LOG_KEY + 'Static browser login successful');
                clearInterval(testInterval);
                resolve(true);
                return;
            }
            if ((new Date()) - checkStartTime > CHECK_TIMEOUT) {
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
                let url = await page.url();
                StatusShot.save(desc, this.job, url, cookies, html, screenShotName);
                NestiaWeb.logger.warn(LOG_KEY + 'Static browser initialization FAILED');
                clearInterval(testInterval);
                resolve(false);

            }
        }, 500);

    })
};

let login = function (page, config) {
    return new Promise(async (resolve) => {
        await page.goto('https://www.campaignasia.com/account/login', {
            waitUntil: 'networkidle0',
            timeout: CHECK_PAGE_NAV_TIMEOUT
        });
        page.lastNetworkRequest = +new Date();
        let testResult = await testPageLoaded(page, async function (page) {
            let TIMEOUT = 30000;
            let startTestTime = Date.now();
            while (true) {
                let loginDomExists = await page.evaluate(() => {
                    return document.getElementById('login-box-email') !== null;
                });
                let alreadyLogin;
                alreadyLogin = await page.evaluate(() => {
                    return window.jQuery ? window.jQuery('a[href="/account/logout"]').length > 0 : false;
                });

                if (loginDomExists) {
                    return 'LOGIN_PAGE_READY';
                } else if (alreadyLogin) {
                    return 'LOGGEDIN';
                }
                if (Date.now() - startTestTime < TIMEOUT) {
                    await sleep(2000);
                } else {
                    return null;
                }
            }
        }, 30);

        if (testResult === false) {
            NestiaWeb.logger.info(LOG_KEY + 'Static browser login page FAILED');
            resolve(false);
            return;
        } else if (testResult === 'LOGGEDIN') {
            NestiaWeb.logger.info(LOG_KEY + 'Static browser already logged in ,DONE');
            resolve(true);
            return;
        }
        NestiaWeb.logger.info(LOG_KEY + 'Static browser login page loaded');

        let position;
        do {
            position = await getElementPosition(page, '#login-box-email');
            if (position.top + position.height > page.__context.viewport.height
                || position.left + position.width > page.__context.viewport.width
                || position.top < 0
                || position.left < 0) {
                await page.evaluate((left, top) => {
                    window.scrollTo(window.scrollX + left, window.scrollY + top);
                }, position.left, position.top);
            } else {
                break;
            }
        } while (true);
        if (position) {
            NestiaWeb.logger.debug(LOG_KEY + 'typing user:');
            await page.mouse.click(position.left + position.width * 0.45, position.top + position.height * 0.55);
            await page.keyboard.type(config.user, {delay: 32});
        }

        do {
            position = await getElementPosition(page, '#password');
            if (position.top + position.height > page.__context.viewport.height
                || position.left + position.width > page.__context.viewport.width
                || position.top < 0
                || position.left < 0) {
                await page.evaluate((left, top) => {
                    window.scrollTo(window.scrollX + left, window.scrollY + top);
                }, position.left, position.top);
            } else {
                break;
            }
        } while (true);
        if (position) {
            NestiaWeb.logger.debug(LOG_KEY + 'typing pwd:');
            await page.mouse.click(position.left + position.width * 0.45, position.top + position.height * 0.55);
            await page.keyboard.type(config.pwd, {delay: 32});
        }
        /*do {
            position = await getElementPosition(page, '[name=remember_me]');
            if (position.top + position.height > page.__context.viewport.height
                || position.left + position.width > page.__context.viewport.width
                || position.top < 0
                || position.left < 0) {
                await page.evaluate((left, top) => {
                    window.scrollTo(window.scrollX + left, window.scrollY + top);
                }, position.left, position.top);
            } else {
                break;
            }
        } while (true);
        if (position) {
            let checked = await page.evaluate(() => {
                return document.querySelector('[name=remember_me]').checked;
            });
            NestiaWeb.logger.debug(LOG_KEY + 'clicking remember');
            if (!checked) {
                await page.mouse.click(position.left + position.width * 0.45, position.top + position.height * 0.55);
            }
        }*/

        let formData = await page.evaluate(function () {
            return {
                user: document.querySelector('#login-box-email').value,
                pwd: document.querySelector('#password').value
            };
        });
        NestiaWeb.logger.debug(LOG_KEY + 'login form data:', formData);
        NestiaWeb.logger.info(LOG_KEY + 'Static browser begin login');
        do {
            position = await getElementPosition(page, 'input[type=submit][value="Sign in"]');
            if (position.top + position.height > page.__context.viewport.height
                || position.left + position.width > page.__context.viewport.width
                || position.top < 0
                || position.left < 0) {
                await page.evaluate((left, top) => {
                    window.scrollTo(window.scrollX + left, window.scrollY + top);
                }, position.left, position.top);
            } else {
                break;
            }
        } while (true);
        if (position) {
            await page.mouse.click(position.left + position.width * 0.45, position.top + position.height * 0.55);
        }

        let checkResult = await checkLogin(page);
        resolve(checkResult);

    });

};

let checkInterval = -1, runningJobs = [];

let $this = {
    key: KEY,
    init: async function () {
        NestiaWeb.logger.info(LOG_KEY + 'Static browser begin initialize');


        let c;
        try {
            c = NestiaWeb.manifest.get('staticBrowsers.' + KEY);
        } catch (e) {
            NestiaWeb.logger.info(LOG_KEY + 'Static browser[' + KEY + '] config missing, abort!');
            return;
        }
        if (!c) {
            NestiaWeb.logger.info(LOG_KEY + 'Static browser[' + KEY + '] config missing, abort!');
            return;
        }
        if (!c.enabled) {
            NestiaWeb.logger.info(LOG_KEY + 'Static browser[' + KEY + '] has been DISABLED, abort!');
            return;
        }

        NestiaWeb.logger.info(LOG_KEY + 'Static browser[' + KEY + '] begin initialize');
        const config = c;

        let page = await pageFactory.getStaticPage(KEY);

        page._networking = {};
        page.on('request', function (request) {
            requestFilter(page, request);
        });
        page.on('response', function (response) {
            responseFilter(page, response);
        });
        NestiaWeb.logger.info(LOG_KEY + 'Static browser create initialize page');
        let loginResult = await login(page, config);


        if (loginResult) {
            ready = true;
        }
        if (tabsPool) {
            try {
                await tabsPool.destroy();
            } catch (e) {
            }
        }
        tabsPool = Pool.createPool({
            name: KEY,
            maxPoolSize: 10,
            minPoolSize: 0,
            selfTestInterval: 300 * 1e3,
            validate: async function () {
                return true;
            },
            produce: async function () {
                let page;
                page = await pageFactory.getStaticPage(KEY);

                page.lastNetworkRequest = +new Date();
                page._networking = {};
                page.on('request', function (request) {
                    requestFilter(page, request);
                });
                page.on('response', function (response) {
                    responseFilter(page, response);
                });
                page.__context.url = 'https://www.campaignasia.com/category/news/718';

                NestiaWeb.logger.info(LOG_KEY + ' init new page done');
                return page;
            },
            finalize: function (item) {
                process.nextTick(function () {
                    pageFactory.releaseStaticPage(item)
                });
            }
        });

        keepAlivePage = page;
        keepAlivePage.on('response', async function (response) {
            let url = response.url();
            if (/^http(s)?:\/\/[^\/]*\.campaignasia\.com\//.test(url)) {
                if (response.status() === 400 || response.status() === 401) {
                    /*waitForLogin = true;
                    process.nextTick(async function () {
                        let result = await login(keepAlivePage, config);
                        NestiaWeb.logger.info(LOG_KEY + 'Static browser secondly login result:' + result);
                        if (result) {
                            ready = true;
                        }
                        waitForLogin = false;
                    })*/
                    ready = false;

                    if (checkInterval >= 0) {
                        clearInterval(checkInterval);
                    }
                    for (let jobDesc of runningJobs) {
                        jobDesc.cancelled = true;
                    }
                    /* keepAlivePage.removeAllListeners('request');
                     keepAlivePage.removeAllListeners('response');
                     await pageFactory.releaseStaticPage(keepAlivePage);
                     keepAlivePage = null;
                                                  */
                }
            }

        });

        checkInterval = setInterval(async function () {
            if (keepAlivePage) {
                if (!ready) {
                    return;
                }

                await keepAlivePage.goto('https://www.campaignasia.com/category/news/718?_t=' + Math.random(), {
                    waitUntil: 'networkidle0',
                    timeout: CHECK_PAGE_NAV_TIMEOUT
                });
                await testPageLoaded(keepAlivePage, async function (page) {
                    return await page.evaluate(() => {
                        return !!document.getElementById('email');
                    });
                });
            }
            ready = true;
        }, KEEP_ALIVE_TIME);

        await page.goto('https://www.campaignasia.com/category/news/718', {
            waitUntil: 'networkidle0',
            timeout: CHECK_PAGE_NAV_TIMEOUT
        });
        NestiaWeb.logger.info(LOG_KEY + 'Static browser initialization COMPLETE!');


    },
    execute: function (params) {
        if (!ready) {
            throw new Error(LOG_KEY + 'Static browser initialize incomplete！');
        }

        let job = {
            url: params.url
        };
        let executor = new JobExecutor(job);

        let jobDesc = {
            job: job,
            cancelled: false
        };
        runningJobs.push(jobDesc);
        return new Promise((resolve, reject) => {
            let checkInterval = -1;
            let removeJob = (jobDesc) => {
                let toRemove = null;
                for (let idx = 0; idx < runningJobs.length; idx++) {
                    let desc = runningJobs[idx];
                    if (desc === jobDesc) {
                        toRemove = idx;
                        break;
                    }
                }
                if (toRemove !== null) {
                    runningJobs.splice(toRemove, 1);
                }
            };
            executor.run().then((data) => {
                if (!jobDesc.cancelled) {
                    if (checkInterval >= 0) {
                        removeJob(jobDesc);
                        clearInterval(checkInterval);
                    }
                    resolve(data);
                }
            }).catch((e) => {
                if (!jobDesc.cancelled) {
                    if (checkInterval >= 0) {
                        removeJob(jobDesc);
                        clearInterval(checkInterval);
                    }
                    reject(e);
                }
            });

            checkInterval = setInterval(() => {
                if (jobDesc.cancelled) {
                    removeJob(jobDesc);
                    clearInterval(checkInterval);
                    executor.finalize(true);
                    resolve({result: false, message: 'JOB cancelled'});
                }
            }, 100);

        })
    }
};

module.exports = $this;
