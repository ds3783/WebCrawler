const Template = require('./template');
const PageFactory = require('../../browser/pageFactory');

const NestiaWeb = require('nestia-web');
const sleep = function (time) {
    return new Promise(resolve => {
        setTimeout(function () {
            resolve();
        }, time);
    })

};

const requestFilter = async (page, request) => {
    let reqUrl = request.url(), lastIdx;

    let promise;


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
    let blockRequest = false;
    if (/(\.jpeg)|(\.gif)|(\.png)|(\.jpg)$/.test(reqUrl) || /mmbiz\.qpic\.cn\/mmbi/.test(reqUrl) || /\/jsreport/.test(reqUrl) || /mp\.weixin\.qq\.com\/rr/.test(reqUrl) || /mp\/getappmsgext/.test(reqUrl) || /btrace\.qq\.com\/kvcollect/.test(reqUrl)) {
        blockRequest = true;
        //is image
    }
    if (!blockRequest && /mp.weixin.qq.com\/mp\/appmsgreport/.test(reqUrl)) {
        blockRequest = true;
    }
    if (!blockRequest && /mp.weixin.qq.com\/mp\/ad_video_report/.test(reqUrl)) {
        blockRequest = true;
    }
    /*if (!blockRequest && /res.wx.qq.com/.test(reqUrl)) {
        if (!/\.css$/.test(reqUrl)) {
            const USELESS_MODULE = [
                // '/mmbizwap/en_US/htmledition/js/biz_wap/moon',
                // '/mmbizwap/en_US/htmledition/js/appmsg/share',
                // '/mmbizwap/en_US/htmledition/js/biz_wap/utils/mmversion',
                '/mmbizwap/en_US/htmledition/js/appmsg/test',
                '/mmbizwap/en_US/htmledition/js/biz_common/utils/report',
                '/mmbizwap/en_US/htmledition/js/appmsg/max_age',
                '/mmbizwap/en_US/htmledition/js/cps/tpl/card_tpl.html',
                '/mmbizwap/en_US/htmledition/js/cps/tpl/banner_tpl.html',
                '/mmbizwap/en_US/htmledition/js/appmsg/appmsg_report',
                '/mmbizwap/en_US/htmledition/js/appmsg/product',
                '/mmbizwap/en_US/htmledition/js/appmsg/review_image',
                // '/mmbizwap/en_US/htmledition/js/appmsg/outer_link',
                '/mmbizwap/en_US/htmledition/js/appmsg/copyright_report',
                '/mmbizwap/en_US/htmledition/js/biz_wap/ui/lazyload_img',
                '/mmbizwap/en_US/htmledition/js/biz_common/log/jserr',
                '/mmbizwap/en_US/htmledition/js/appmsg/cdn_speed_report',
                '/mmbizwap/en_US/htmledition/js/appmsg/page_pos',
                '/mmbizwap/en_US/htmledition/js/appmsg/report_and_source',
                '/mmbizwap/en_US/htmledition/js/appmsg/fereport_without_localstorage',
                '/mmbizwap/en_US/htmledition/js/appmsg/fereport',
                '/mmbizwap/en_US/htmledition/js/biz_wap/safe/mutation_observer_report',
                '/mmbizwap/en_US/htmledition/js/sougou/index',
                // '/mmbizwap/en_US/htmledition/js/biz_wap/utils/log',
                // '/mmbizwap/en_US/htmledition/js/biz_common/utils/respTypes',
                // '/mmbizwap/en_US/htmledition/js/biz_wap/utils/ajax_wx',
                // '/mmbizwap/en_US/htmledition/js/pages/video_communicate_adaptor',
                // '/mmbizwap/en_US/htmledition/js/biz_common/utils/cookie',
                // '/mmbizwap/en_US/htmledition/js/appmsg/topic_tpl.html',
                // '/mmbizwap/en_US/htmledition/js/question_answer/appmsg_tpl.html',
                // '/mmbizwap/en_US/htmledition/js/pages/weapp_tpl.html',
                // '/mmbizwap/en_US/htmledition/js/pages/voice_tpl.html',
                // '/mmbizwap/en_US/htmledition/js/pages/kugoumusic_ctrl',
            ];
            for (let useless of USELESS_MODULE) {
                if (reqUrl.indexOf(useless) >= 0) {
                    reqUrl = reqUrl.replace(new RegExp(useless + '\\w+\\.js(,)?'), '');
                    if (reqUrl.endsWith(',')) {
                        reqUrl = reqUrl.replace(/,$/, '');
                    }
                    if ('https://res.wx.qq.com' === reqUrl) {
                        blockRequest = true;
                    }
                }
            }
        }
    }*/

    if (!/about:blank/.test(page.__context.url) && blockRequest) {
        promise = request.abort('aborted');
    } else {
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
            /*promise = request.continue(
                {
                    url: (isHttps ? reqUrl.replace(/^https:/, 'http:') : reqUrl) + '@' + encodeURIComponent(JSON.stringify(extraHeaders)),
                    headers: headers
                }
            );*/
            promise = request.continue();
        } else {
            promise = request.continue();
        }

    }
    promise.catch(function (e) {
        NestiaWeb.logger.error('Error control request[' + reqUrl + '] on page[' + page.__context.url + '],message: ' + e.message, e);
    });
    /*    page.evaluate((viewport) => {
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
};

const formatter = {
    newPage: async function (job) {
        let viewport = {
            width: 750,
            height: 1334,
            deviceScaleFactor: 1,
            isMobile: true,
        };
        job.viewport = viewport;
        job.direct_proxy = true;
        let page = await PageFactory.getPage(job);
        await page.setRequestInterception(true);
        await page.setViewport(viewport);
        return page;
    },
    fetchContent: async function (page, job, BROWSER_SCRIPTS) {
        page.on('request', async (request) => {
            return await requestFilter(page, request);
        });

        page.on('load', async () => {
            NestiaWeb.logger.info('wechat page loaded:');
        });
        NestiaWeb.logger.info('WECHAT News detail, begin fetch: ' + job.source.url, job);
        await page.goto(job.source.url, {
            timeout: 60000,
            waitUntil: 'domcontentloaded'
        });
        // page.injectJQuery
        await page.evaluate(jsContent => {
            /*var script = document.createElement('script');
            script.innerHTML = jsContent;
            (document.head || document.body).appendChild(script);*/
            eval(jsContent);
        }, BROWSER_SCRIPTS['jquery-3.3.1.min.js']);

        page.on('console', async msg => {
            let messages = ['[CONSOLE] '];
            for (let arg of msg.args()) {
                let msg = await arg.jsonValue();
                if (msg) {
                    messages.push(msg);
                }
            }
            if (messages.length) {
                NestiaWeb.logger.info.apply(NestiaWeb.logger.info, messages);
            }
        });
        job.isChinese = true;
        //scroll for load content
        await page.evaluate(() => {
            window.scroll(0, 0);
        });

        while (true) {
            let scrollY = await page.evaluate(() => {
                return window.scrollY;
            });
            let result = await page.evaluate(() => {
                window.scroll(0, window.scrollY + document.documentElement.clientHeight * 0.3);
                return window.scrollY;
            });

            await sleep(50);
            if (scrollY === result) {
                break;
            }
        }

        //wait for content loaded
        await sleep(3000);
        // page.inject JS vars
        await page.evaluate(() => {
            window.__NESTIA_DEFRAG_ID__ = 'js_content';
        });
    },
    releasePage: async function (page, job) {

        page.removeAllListeners('load');
        page.removeAllListeners('request');
        page.removeAllListeners('response');
        await page.setRequestInterception(false);
        await page.evaluate(() => {
            document.body.innerHTML = '';
        });
        await page.goto('about:blank');

        await sleep(1000);
        return await PageFactory.releasePage(job, page);
    },
    preDefrag: async function (page, job, BROWSER_SCRIPTS) {
        let frames = page.frames();
        let videos = {};

        await page.evaluate((filterScript, videos) => {
            window.__N_VIDEOS = videos;

            // var script = document.createElement('script');
            // script.innerHTML = filterScript;
            // (document.body || document.head).appendChild(script);
            try {
                eval(filterScript);
            } catch (e) {
                console.log('Error executing WECHAT FILTER:' + filterScript.length, e.message);
            }
        }, BROWSER_SCRIPTS['wechatFilter.js'], videos);

        for (let frame of frames) {
            let url = frame.url();
            if (/(v\.qq\.com\/.*\/player.html)|(mp\/videoplayer)/.test(url)) {
                try {
                    await frame.waitFor('html');
                } catch (e) {
                    continue;
                }
                await frame.evaluate((filterScript) => {
                    var script = document.createElement('script');
                    script.innerHTML = filterScript;
                    var injectElem = document.head || document.body;
                    injectElem && injectElem.appendChild(script);
                }, BROWSER_SCRIPTS['wechatExtractVideo.js']);
                let videoObj = await frame.evaluate(() => {
                    return window.__N_VIDEO_RESULT;
                });

                /*
                * 
                { vid: 'wxv_639377109043003392',
                  src: 'http://mpvideo.qpic.cn/tjg_3084766754_50000_7839a8dd17c445808515c8212bee1710.f10002.mp4?dis_k=5681c2c89bca575cad2ebdf3e834e024&dis_t=1555250196',
                  cover_image:{ url: 'https://mp.weixin.qq.com/mp/videoplayer?action=get_mp_video_cover&vid=wxv_639377109043003392' }
                }
      */
                if (videoObj && videoObj.vid && videoObj.src) {
                    videos[videoObj.vid] = videoObj;
                } else {
                    //failed get video info
                    job.extraData = job.extraData || {};
                    job.extraData.ignore = true;
                }

            }
        }

        let unLoadedVideoCnt = await page.evaluate(function () {
            var containers = document.getElementsByClassName('js_tx_video_container');
            var cnt = 0;
            for (var i = 0; i < containers.length; i++) {
                if (containers[i].getElementsByTagName('iframe').length === 0) {
                    cnt++;
                }
            }
            cnt += document.querySelectorAll('.wx_video_thumb_primary').length;
            return cnt;
        });

        if (unLoadedVideoCnt > 0) {
            job.extraData = job.extraData || {};
            job.extraData.ignore = true;
        }
        // page.removeAllListeners('request');
    },
    postDefrag: async function (page, job, ignore_BROWSER_SCRIPTS) {
        let extraData = await page.evaluate(() => {
            var result = {
                author: ($('#js_name').text() || '').trim(),
                title: ($('#activity-name').text() || '').trim(),
                publishedAt: (new Date()).getTime(),
            };
            var ss = document.getElementsByTagName('script');
            for (var s of ss) {
                if (s.innerHTML && typeof s.innerHTML === 'string') {
                    var matches = s.innerHTML.match(/var publish_time =(.*);/);
                    if (matches) {
                        try {
                            result.publishedAt = (new Date(eval(matches[1]) + ' 00:00:00 GMT+0')).getTime();
                        } catch (e) {
                        }
                    }
                }
            }
            return result;
        });
        job.extraData = Object.assign(job.extraData || {}, extraData || {});
    },
    filterResult: async function (retObj, job) {
        Object.assign(retObj, job.extraData || {});
        NestiaWeb.logger.info('WECHAT news:', retObj);
        if (!retObj.author) {
            NestiaWeb.logger.info('[WARN] WECHAT news NO AUTHOR');
            retObj.ignore = true;
        }
    }
};


module.exports = Object.assign({}, Template, formatter);