const NestiaWeb = require('nestia-web');
const pageFactory = require('../../browser/pageFactory');

const Pool = require('../Pool');

const KEY = 'PG_CONDO_INFO';
const LOG_KEY = '[' + KEY + ']';

const JOB_NETWORK_TIMEOUT = 1e3;
const JOB_TIMEOUT = 60 * 1e3;
const CHECK_TIMEOUT = 30 * 1e3;
const CHECK_RESULT_TIMEOUT = 8 * 1e3;
const KEEP_ALIVE_TIME = 30 * 60 * 1e3;
const CHECK_PAGE_NAV_TIMEOUT = 30 * 1e3;


let ready = false, tabsPool = null;

class JobExecutor {
    constructor(jobs) {
        this.jobs = jobs || [];
        this.result = {};
        this.testedKeywords = {};
        this.testedIds = {};

    }


    async run() {
        let _this = this;
        try {
            this.poolItem = await tabsPool.getItem();
        } catch (e) {
            NestiaWeb.logger.error('Error get browser tab:' + e.message, e);
            return {result: false, message: e.message};
        }
        let page = this.poolItem.item;
        let responseCollect = function (response) {
            _this.collectResult(response);
        };
        page.on('response', responseCollect);
        let position, notFound = [];
        do {
            position = await getElementPosition(page, '#propertySearch');
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

            for (let job of this.jobs) {
                await page.evaluate(() => {
                    var input = document.getElementById('propertySearch');
                    if (input) {
                        input.value = '';
                    }
                });
                await page.mouse.click(position.left + position.width * 0.45, position.top + position.height * 0.55);
                let keywords = job.name.split(' ');
                let inputedKeyword = '';

                let liIdx = null;
                for (let k = 0; k < keywords.length; k++) {
                    let keyword = keywords[k] || '';
                    if (/^\s*$/.test(keyword)) {
                        continue;
                    }
                    NestiaWeb.logger.debug('typing keywords:' + keyword);
                    if (k !== 0) {
                        inputedKeyword += ' ';
                        await page.keyboard.sendCharacter(' ');
                    }

                    await page.keyboard.type(keyword, {delay: 32});

                    inputedKeyword += keyword;
                    let result = await this.checkResult(inputedKeyword, job.id);
                    if (result !== false) {
                        liIdx = result;
                        NestiaWeb.logger.debug('got keywords on idx:' + liIdx);
                        break;
                    }
                }
                if (liIdx !== null) {
                    let suggestPosition;
                    await page.evaluate((selector) => {
                        var dom = document.querySelector(selector);
                        if (dom && dom.scrollIntoView) {
                            dom.scrollIntoView();
                        }
                    }, '.property-results li:nth-of-type(' + (liIdx + 1) + ')');
                    suggestPosition = await getElementPosition(page, '.property-results li:nth-of-type(' + (liIdx + 1) + ')');

                    NestiaWeb.logger.debug('clicking keywords on idx:' + liIdx);
                    await page.mouse.click(suggestPosition.left + suggestPosition.width * 0.45, suggestPosition.top + suggestPosition.height * 0.55);
                    let result = await this.checkFinalResult(job.id);
                    if (!result) {
                        notFound.push(job.id);
                    }
                } else {
                    notFound.push(job.id);
                }

            }

        }
        let result = {result: notFound.length === 0, data: Object.values(this.result)};
        if (notFound.length > 0) {
            result.message = 'Id' + JSON.stringify(notFound) + ' not found in result set';
        }
        NestiaWeb.logger.info('StaticJob Complete result:' + result.result + ' data:' + (result.data ? result.data.length + ' items' : 'no data') + ' ,param:' + JSON.stringify(this.jobs));
        page.removeListener('response', responseCollect);
        this.finalize();
        return result;
    }

    async collectResult(response) {
        if (response.ok) {
            let url = response.url();
            this.testedIds = {};
            if (/\/autocomplete?/.test(url)) {
                let text = await response.text();
                let obj = null;
                try {
                    obj = JSON.parse(text);
                } catch (e) {
                }
                if (obj && Array.isArray(obj)) {
                    for (let i = 0; i < obj.length; i++) {
                        let condo = obj[i];
                        if (condo && condo.objectId) {
                            this.testedIds[condo.objectId] = i;
                        }
                    }
                }
                let matches = url.match(/[?&]query=([^&]+)([&].*)?$/);
                if (matches && matches.length > 1) {
                    this.testedKeywords[decodeURIComponent(matches[1])] = true;
                }

            } else if (/\/property-info\/\d+/.test(url)) {
                let text = await response.text();
                let obj = null;
                try {
                    obj = JSON.parse(text);
                } catch (e) {
                }
                if (obj) {
                    this.result[obj.propertyIdPg] = obj;
                }
            }

        }
    }

    checkResult(inputtedKeyword, id) {
        let _this = this;
        return new Promise(function (resolve) {
            let timeout, interval;
            timeout = setTimeout(function () {
                clearInterval(interval);
                resolve(false);
            }, CHECK_RESULT_TIMEOUT);
            interval = setInterval(function () {
                if (_this.testedKeywords[inputtedKeyword] && typeof _this.testedIds[id] === 'number') {
                    clearInterval(interval);
                    clearTimeout(timeout);
                    resolve(_this.testedIds[id]);
                }
            }, 50);
        });
    }

    checkFinalResult(id) {
        let _this = this;
        return new Promise(function (resolve) {
            let timeout, interval;
            timeout = setTimeout(function () {
                clearInterval(interval);
                resolve(false);
            }, CHECK_RESULT_TIMEOUT);
            interval = setInterval(function () {
                if (_this.result[id]) {
                    clearInterval(interval);
                    clearTimeout(timeout);
                    setTimeout(function () {
                        //add a time delay let js process result
                        resolve(true);
                    }, 500);
                }
            }, 50);
        });
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
    let pass = !/google|twitter|rubiconproject|fout\.jp|facebook|\.jpg|\.png|\.gif|scorecardresearch|doubleclick|en25\.com|eloqua\.com|survicate\.com|intercom\.io/.test(url);
    let promise;
    if (pass) {
        let isHttps = /^https:\/\//.test(url), isOriginHttps = /^https:\/\//.test(page.__context.url);

        if (isHttps && !/google|twitter|rubiconproject|fout\.jp|facebook|\.jpg|\.png|\.gif|scorecardresearch|doubleclick|en25\.com|eloqua\.com|survicate\.com|intercom\.io|pgimgs\.com/.test(url)) {
            if (page._networking.hasOwnProperty(url)) {
                page._networking[url]++;
            } else {
                page._networking[url] = 1;
            }
        }


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
        promise = request.abort();
    }
    /*page.waitFor("//html").then( ()=> {
        page.evaluate((viewport) => {
            window.__defineGetter__('innerWidth', function () {return viewport.width;});
            window.__defineGetter__('innerHeight', function () {return viewport.height;});
            window.__defineGetter__('outerWidth', function () {return viewport.width;});
            window.__defineGetter__('outerHeight', function () {return viewport.height;});
            screen.__defineGetter__('width', function () {return viewport.width;});
            screen.__defineGetter__('availWidth', function () {return viewport.width;});
            screen.__defineGetter__('height', function () {return viewport.height;});
            screen.__defineGetter__('availHeight', function () {return viewport.height;});
            navigator.__defineGetter__('webdriver', function () {return window.undefined;});
        }, page.__context.viewport).catch((e) => {
            NestiaWeb.logger.error('Error fake resolution:' + e.message, e);
        });
    });*/

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

let testPageLoaded = async function (page, validateFunc) {
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
                if (usedTime > JOB_NETWORK_TIMEOUT && Object.keys(page._networking).length === 0) {
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
            let validClassName = await page.evaluate(() => {
                var dom = document.querySelector('.my-account');
                if (dom) {
                    return dom.className;
                }
                return '';
            });
            if (validClassName && !/^(.* )?hide( .*)?$/.test(validClassName)) {
                //success
                NestiaWeb.logger.info(LOG_KEY + 'Static browser login successful');
                clearInterval(testInterval);
                resolve(true);
                return;
            }
            if ((new Date()) - checkStartTime > CHECK_TIMEOUT) {

                NestiaWeb.logger.warn(LOG_KEY + 'Static browser initialization FAILED');
                clearInterval(testInterval);
                resolve(false);
            }
        }, 500);

    })
};

let login = function (page, config) {
    return new Promise(async (resolve) => {
        await page.goto('https://www.propertyguru.com.sg/user/login', {
            waitUntil: 'domcontentloaded',
        });
        page.lastNetworkRequest = +new Date();
        let testResult = await testPageLoaded(page, async function (page) {
            let loginDomExists = await page.evaluate(() => {
                return document.getElementById('form_internal_btn_login') !== null;
            });
            let url = page.url(), alreadyLogin;
            alreadyLogin = /^http(s)?:\/\/[^\/]+(\/)?(\?.*)?(#.*)?$/.test(url);
            if (loginDomExists) {
                return 'LOGIN_PAGE_READY';
            } else if (alreadyLogin) {
                return 'LOGGEDIN';
            }
            return null;
        });

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
            position = await getElementPosition(page, '#userid');
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
        do {
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
        }

        let formData = await page.evaluate(function () {
            return {
                user: document.querySelector('#userid').value,
                pwd: document.querySelector('#password').value,
                remember: document.querySelector('[name=remember_me]').checked
            };
        });
        NestiaWeb.logger.debug(LOG_KEY + 'login form data:', formData);
        NestiaWeb.logger.info(LOG_KEY + 'Static browser begin login');
        do {
            position = await getElementPosition(page, '#form_internal_btn_login');
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
                page.__context.url = 'https://agentnet.propertyguru.com.sg/listing_management';
                page.goto('https://agentnet.propertyguru.com.sg/create-listing/location', {
                    waitUntil: 'networkidle0',
                });
                page.lastNetworkRequest = +new Date();

                let testResult = await testPageLoaded(page, async function (page) {
                    return await page.evaluate(function () {
                        return typeof window.reactivationListing === 'function' && typeof window.jQuery === 'function' && !!document.getElementById('propertySearch');
                    });
                });
                if (!testResult) {
                    NestiaWeb.logger.error(LOG_KEY + 'browser form page FAILED');
                    await pageFactory.releaseStaticPage(page);
                    // todo snapshot 
                    throw new Error(LOG_KEY + ' init new page failed');
                }
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
            if (/^http(s)?:\/\/[^\/]*\.propertyguru\.com\.sg\//.test(url)) {
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
                    /*keepAlivePage.removeAllListeners('request');
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

                await keepAlivePage.goto('https://agentnet.propertyguru.com.sg', {
                    waitUntil: 'networkidle0',
                    timeout: CHECK_PAGE_NAV_TIMEOUT
                });
                await testPageLoaded(keepAlivePage, async function (page) {
                    return await page.evaluate(() => {
                        return !!document.querySelector('.btn-inverse');
                    });
                });
                await keepAlivePage.goto('https://agentnet.propertyguru.com.sg/listing_management', {
                    waitUntil: 'networkidle0',
                    timeout: CHECK_PAGE_NAV_TIMEOUT
                });
                await testPageLoaded(keepAlivePage, async function (page) {
                    return await page.evaluate(() => {
                        return !!document.querySelector('#createNewBottom');
                    });
                });
            }
            ready = true;
        }, KEEP_ALIVE_TIME);

        await page.goto('https://agentnet.propertyguru.com.sg', {
            waitUntil: 'networkidle0',
            timeout: CHECK_PAGE_NAV_TIMEOUT
        });
        await page.goto('https://agentnet.propertyguru.com.sg/listing_management', {
            waitUntil: 'networkidle0',
            timeout: CHECK_PAGE_NAV_TIMEOUT
        });
        NestiaWeb.logger.info(LOG_KEY + 'Static browser initialization COMPLETE!');


    },
    execute: function (params) {
        if (!ready) {
            throw new Error(LOG_KEY + 'Static browser initialize incomplete！');
        }

        let ids = params.ids.split(',');
        let names = params.names.split(',');
        let jobs = [];
        for (let i = 0; i < ids.length; i++) {
            jobs.push({id: ids[i], name: names[i]});
        }
        let executor = new JobExecutor(jobs);

        let jobDesc = {
            jobs: jobs,
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
