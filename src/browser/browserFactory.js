const puppeteer = require('puppeteer-extra');
const NestiaWeb = require('nestia-web');
const fs = require('fs');
const path = require('path');
const BrowserDesc = require('./browserDesc');
const uuid = require('uuid');
const Luminati = require('./LuminatiProxy');
const uuidv1 = uuid.v1;

// a browser survive max for 7 minutes
const MAX_BROWSER_SURVIVE_TIME = 7 * 60 * 1E3;

let browserCache = {};

let staticBrowser = {};

let staticBrowserMapping = {};

const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const {executablePath} = require('puppeteer')


/*
* 生成浏览器唯一标识符
* */
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

/*
* 删除指定目录，效果和 rm -fr 相同
* */
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

/*
* 设置浏览器最后使用时间
* */
const setLastUsed = function (key, id) {
    "use strict";
    let caches = browserCache[key] || [];
    for (let cache of caches) {
        if (cache.id === id) {
            cache.lastUsed = +new Date();
        }
    }

};

/*
* 关闭浏览器实例
* */
const shutdownBrowser = async function (browserDesc) {
    let dataDir = browserDesc.dataDir;
    try {
        await browserDesc.browser.close();
    } finally {
        deleteFolderRecursive(dataDir);
    }

};

/*
* 构造浏览器唯一标识、屏幕参数、user-agent、以及启动参数
* */
const generateBrowserParameter = async function (job) {
    let args = [];

    let key = job.key || getBrowserKey(job);
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
    let proxyProvider;
    if (job.proxy_host && job.proxy_port) {
        // let isLuminati = await Luminati.isLuminatiProxy(job.proxy_host, job.proxy_port);
        let isLuminati = false;
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

    NestiaWeb.logger.info('Browser Context:', JSON.stringify(ctx));
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
// 设置定时，清理长期不用或者被标记位失效的浏览器实例
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
// 初始化静态浏览器实例，这些实例在系统关闭前不会被销毁
        await this.initStaticBrowser(staticBrowserCb);
// 设置系统关闭时，先销毁所有浏览器实例
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
// 初始化静态浏览器实例 
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
                        //检查cache
                        let currentBrowser = $this.getStaticBrowser(browserCode);

                        if (currentBrowser) {
                            staticBrowserCb && staticBrowserCb(browserCode);

                        } else {
                            //如果cache未命中，构造新浏览器实例
                            // 获得参数，包括屏幕分辨率，user-agent，和启动参数
                            let parameters = await generateBrowserParameter(job);


                            let dataDir = path.join(__dirname, '..', '..', 'chromeData', parameters.id);
                            // 创建新浏览器实例
                            let b = await puppeteer.launch({
                                args: parameters.cmdArguments,
                                userDataDir: dataDir,
                                handleSIGINT: false,
                                headless: parameters.headless,
                                executablePath: executablePath(),
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
    markUnavailable: async function (key, id) {
// 标记浏览器实例失效，下次清理时将被关闭
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
        //借出一个新页面
        return new Promise(function (resolve, reject) {
            // 获得参数，包括屏幕分辨率，user-agent，和启动参数
            generateBrowserParameter(job).then(function (parameters) {
                // 查询cache
                if (browserCache.hasOwnProperty(parameters.key)) {
                    let browserArr = browserCache[parameters.key];
                    for (let browser of browserArr) {
                        if (browser && browser.available) {
                            setLastUsed(parameters.key, browser.id);
                            // 如果cache命中，直接返回
                            resolve(browser.browser);
                            return;
                        }
                    }

                }
                {
                    // cache未命中，创建新浏览器实例
                    let dataDir = path.join(__dirname, '..', '..', 'chromeData', parameters.id);
                    NestiaWeb.logger.info('Start launch browser[' + parameters.cmdArguments.join(',') + '] with dataDir[' + dataDir + '], headless[' + parameters.headless + ']');
                    puppeteer.launch({
                        ignoreHTTPSErrors: true,
                        args: parameters.cmdArguments,
                        userDataDir: dataDir,
                        handleSIGINT: false,
                        headless: parameters.headless,
                        executablePath: executablePath(),
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
// 返回静态浏览器实例
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