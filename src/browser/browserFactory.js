const puppeteer = require('puppeteer');
const NestiaWeb = require('nestia-web');
const fs = require('fs');
const path = require('path');
const BrowserDesc = require('./browserDesc');
const uuidv1 = require('uuid/v1');
const Luminati = require('./LuminatiProxy');


// a browser survive max for 7 minutes
const MAX_BROWSER_SURVIVE_TIME = 7 * 60 * 1E3;

let browserCache = {};

let staticBrowser = {};

let staticBrowserMapping = {};


const getBrowserKey = function (job) {
    let prefix = job.static ? 'static' : 'dynamic';

    let proxy;
    if (job.proxy_host && job.proxy_port) {
        if (!job.direct_proxy) {
            proxy = job.proxy_host + '_' + job.proxy_port;
        } else {
            proxy = 'direct_' + job.proxy_host + '_' + job.proxy_port;
        }

    } else {
        proxy = 'no-proxy';
    }
    let headless = (typeof job.headlessBrowser === 'boolean' ? job.headlessBrowser : true);
    let headlessStr = '';
    if (!headless) {
        headlessStr = 'no-headless';
    }
    return `${prefix}_${proxy}_${headlessStr}`;
};

const deleteFolderRecursive = function (p) {
    if (fs.existsSync(p)) {
        fs.readdirSync(p).forEach(function (file) {
            let curPath = path.join(p, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(p);
    }
};

const setLastUsed = function (key, id) {
    "use strict";
    let caches = browserCache[key] || [];
    for (let cache of caches) {
        if (cache.id === id) {
            cache.lastUsed = +new Date();
        }
    }

};

const shutdownBrowser = async function (browserDesc) {
    let dataDir = browserDesc.dataDir;
    try {
        await browserDesc.browser.close();
    } finally {
        deleteFolderRecursive(dataDir);
    }

};

const generateBrowserParameter = async function (job) {
    let args = [];

    let key = getBrowserKey(job);
    let headless = (typeof job.headlessBrowser === 'boolean' ? job.headlessBrowser : true);
    let browserDesc = BrowserDesc.getDesc();
    let useLocalProxy = false;
    if (!!job.viewport) {
        browserDesc.viewport = job.viewport;
    }
    args.push('--n-id=' + key);
    if (job.proxy_host && job.proxy_port) {
        if (!job.direct_proxy) {
            useLocalProxy = true;
            args.push('--proxy-server=http://' + '127.0.0.1' + ':' + NestiaWeb.manifest.get('proxyPort'));
        } else {
            args.push('--proxy-server=http://' + job.proxy_host + ':' + job.proxy_port);
        }
    }
    args.push('--cast-initial-screen-width=' + browserDesc.viewport.width);
    args.push('--cast-initial-screen-height=' + browserDesc.viewport.height);
    args.push('--ash-host-window-bounds=' + browserDesc.viewport.width + 'x' + browserDesc.viewport.height);
    args.push('--disable-web-security');
    let id = uuidv1();
    let proxyProvider = '';
    if (job.proxy_host && job.proxy_port) {
        let isLuminati = await Luminati.isLuminatiProxy(job.proxy_host, job.proxy_port);
        if (isLuminati) {
            proxyProvider = 'LUMINATI';
        } else if (job.proxy_port === 8888) {
            proxyProvider = 'LOCAL';
        } else {
            //TODO:
            proxyProvider = 'UNKNOWN';
        }
    } else {
        proxyProvider = 'NONE';
    }

    let ctx = {
        key: key,
        id: id,
        proxy_host: job.proxy_host,
        proxy_port: job.proxy_port,
        direct_proxy: !!job.direct_proxy,
        ua: browserDesc.ua,
        acceptLanguage: browserDesc.acceptLanguage,
        viewport: browserDesc.viewport,
        useBlankPage: !!job.useBlankPage,
        useLocalProxy: useLocalProxy,
        proxyProvider: proxyProvider,
        initialTime: Date.now()
    };

    NestiaWeb.logger.info('Browser Context:', ctx);
    return {
        key,
        id,
        headless,
        browserDesc,
        cmdArguments: args,
        context: ctx
    }
};


module.exports = {
    init: async function (staticBrowserCb) {
        "use strict";
        let $this = this;
        setInterval(async function () {
            let now = +new Date();
            for (let key in browserCache) {
                if (browserCache.hasOwnProperty(key)) {
                    let cacheArr = [].concat(browserCache[key]);
                    for (let cache of cacheArr) {

                        let browser = cache.browser;
                        let browserContext = browser.__context;
                        if (now - cache.lastUsed > MAX_BROWSER_SURVIVE_TIME || !cache.available) {
                            shutdownBrowser(cache).then(() => {
                                browserCache[key] = browserCache[key].filter(item => item !== cache);
                                if (!cache.available) {
                                    NestiaWeb.logger.info('Browser[' + key + '] closed because it not available!');
                                } else {
                                    NestiaWeb.logger.info('Browser[' + key + '] closed because long time no used');
                                }

                            }).catch((e) => {
                                browserCache[key] = browserCache[key].filter(item => item !== cache);
                                NestiaWeb.logger.error('Error closing browser[' + key + ']', e);
                            });
                        } else {
                            browser.pages().then(async function (pageArr) {
                                if (browserContext.proxyProvider === 'LUMINATI' && (Date.now() - browserContext.initialTime < 7200000)) {
                                    //preserve LUMINATI instances for 2hours
                                    return;
                                }
                                if (!browserContext.useBlankPage && pageArr.length === 1 && 'about:blank' === pageArr[0].url()) {
                                    NestiaWeb.logger.info('Browser[' + key + '] marked unavailable because seem no longer using!');
                                    await $this.markUnavailable(key, cache.id);
                                } else if (pageArr.length === 0) {
                                    NestiaWeb.logger.info('Browser[' + key + '] marked unavailable because seem no longer using!');
                                    await $this.markUnavailable(key, cache.id);
                                }
                            });
                        }
                    }
                }
            }
            let browserStatics = {};
            for (let key in browserCache) {
                let cnt = browserCache[key] ? browserCache[key].length : 0;
                browserStatics[key] = cnt;
                if (cnt === 0) {
                    delete browserCache[key];
                }
            }
            NestiaWeb.logger.info('BROWSER STATICS:', browserStatics)
        }, 120 * 1e3);

        let browserDataDir = path.join(__dirname, '..', '..', 'chromeData');
        if (fs.existsSync(browserDataDir)) {
            deleteFolderRecursive(browserDataDir);
        }
        fs.mkdirSync(browserDataDir);

        await this.initStaticBrowser(staticBrowserCb);
        NestiaWeb.on('SHUTDOWN', function () {
            for (let key in browserCache) {
                if (browserCache.hasOwnProperty(key)) {
                    let cacheArr = browserCache[key];
                    for (let cache of cacheArr) {
                        shutdownBrowser(cache).then(() => {
                            browserCache[key] = browserCache[key].filter(item => item !== cache);
                            NestiaWeb.logger.info('Browser[' + key + '] closed on system SHUTDOWN event.');
                        }).catch((e) => {
                            NestiaWeb.logger.error('Error closing browser[' + key + ']', e);
                        });
                    }
                }
            }

            for (let key in staticBrowser) {
                if (!staticBrowser.hasOwnProperty(key)) {
                    continue;
                }
                let browser = staticBrowser[key];
                if (browser) {
                    let browserId = browser.id;
                    try {
                        shutdownBrowser(browser).then(() => {
                            delete staticBrowser[key];
                            NestiaWeb.logger.info('Static Browser[' + key + '][' + browserId + '] closed on system SHUTDOWN event.');
                        }, (e) => {
                            NestiaWeb.logger.error('Error closing static browser[' + key + '][' + browserId + ']', e);
                        }).catch((e) => {
                            NestiaWeb.logger.error('Error closing static browser[' + key + '][' + browserId + ']', e);
                        });
                    } catch (e) {
                        NestiaWeb.logger.error('Error closing static browser[' + key + '][' + browserId + ']', e);
                    }
                }
            }
        });
    },
    initStaticBrowser: async function (staticBrowserCb) {
        "use strict";

        const browsers = NestiaWeb.manifest.get('staticBrowsers');
        for (let browserCode in browsers) {
            if (!browsers.hasOwnProperty(browserCode)) {
                continue;
            }

            let job = Object.assign({static: true}, browsers[browserCode]);
            if (!job || !job.enabled) {
                NestiaWeb.logger.info('Skip static browser[' + browserCode + ']!');
                continue;
            }
            NestiaWeb.logger.info('Initializing static browser[' + browserCode + ']!');

            try {
                let $this = this;
                await (async function () {
                        let currentBrowser = $this.getStaticBrowser(browserCode);
                        if (currentBrowser) {
                            staticBrowserCb && staticBrowserCb(browserCode);

                        } else {
                            let parameters = await generateBrowserParameter(job);


                            let dataDir = path.join(__dirname, '..', '..', 'chromeData', parameters.id);
                            let b = await puppeteer.launch({
                                args: parameters.cmdArguments,
                                userDataDir: dataDir,
                                handleSIGINT: false,
                                headless: parameters.headless
                            });
                            b.__key = parameters.key;
                            b.__newPage = b.newPage;
                            b.newPage = function () {
                                setLastUsed(parameters.key, parameters.id);
                                return this.__newPage.apply(this, arguments);
                            };
                            b.__context = Object.assign({}, parameters.context);
                            NestiaWeb.logger.info('Static Browser[' + parameters.cmdArguments.join(',') + '] created');
                            staticBrowser[parameters.key] = {
                                key: parameters.key,
                                id: parameters.id,
                                dataDir,
                                browser: b,
                                lastUsed: +new Date(),
                                available: true
                            };
                            staticBrowserMapping[browserCode] = parameters.key;
                        }
                    }
                )();
                staticBrowserCb && staticBrowserCb(browserCode);
            } catch (e) {
                NestiaWeb.logger.fatal('Error init static Browser[' + browserCode + ']', e);
            }

        }
    },
    markUnavailable: async function (key, id, force) {
        let cache = null;
        if (browserCache.hasOwnProperty(key)) {
            let cacheArr = browserCache[key];
            for (let c of cacheArr) {
                if (c.id === id) {
                    cache = c;
                    break;
                }
            }
        }
        if (cache) {
            cache.available = false;
            NestiaWeb.logger.warn('Browser[' + key + '][' + id + '] is marked unavailable!');
        }
    }
    ,
    borrow: function (job) {
        "use strict";

        return new Promise(function (resolve, reject) {
            generateBrowserParameter(job).then(function (parameters) {

                if (browserCache.hasOwnProperty(parameters.key)) {
                    let browserArr = browserCache[parameters.key];
                    for (let browser of browserArr) {
                        if (browser && browser.available) {
                            setLastUsed(parameters.key, browser.id);
                            resolve(browser.browser);
                            return;
                        }
                    }

                }
                {
                    let dataDir = path.join(__dirname, '..', '..', 'chromeData', parameters.id);
                    puppeteer.launch({
                        ignoreHTTPSErrors: true,
                        args: parameters.cmdArguments,
                        userDataDir: dataDir,
                        handleSIGINT: false,
                        headless: parameters.headless
                    }).then(b => {
                        b.__key = parameters.key;
                        b.__newPage = b.newPage;
                        b.newPage = function () {
                            setLastUsed(parameters.key, parameters.id);
                            return this.__newPage.apply(this, arguments);
                        };

                        if (!browserCache[parameters.key]) {
                            browserCache[parameters.key] = [];
                        }
                        b.__context = Object.assign({}, parameters.context);

                        browserCache[parameters.key].push({
                            key: parameters.key,
                            id: parameters.id,
                            browser: b,
                            dataDir,
                            lastUsed: +new Date(),
                            available: true
                        });
                        NestiaWeb.logger.info('Browser[' + parameters.cmdArguments.join(',') + '] created');
                        resolve(b);
                    }).catch((e) => {
                        NestiaWeb.logger.error('Error when create Browser[' + parameters.cmdArguments.join(',') + ']', e);
                        reject(e);
                    });
                }
            });


        });
    }
    ,
    getStaticBrowser(code) {
        const browsers = NestiaWeb.manifest.get('staticBrowsers');
        let job = Object.assign({static: true}, browsers[code]);
        let key = getBrowserKey(job);
        if (key) {
            let browser = staticBrowser[key];
            if (browser) {
                return browser.browser;
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }
}
;