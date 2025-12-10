const NestiaWeb = require('nestia-web');
const Browser = require('./index');


module.exports = {
  getPage: async function (job) {
    "use strict";
    //相对getStaticPage, getPage 借用的浏览器实例在一段时间后将会被销毁。
    // 从Browser借出browser对象实例
    const BrowserFactory = Browser.getBrowserFactory();
    const browser = await BrowserFactory.borrow(job);
    //创新一个新页面
    const page = await browser.newPage();
    page.__context = Object.assign({}, browser.__context);
    page.__context.url = '';


    //fix "Cannot find context with specified id undefined" problem
    // @see https://github.com/Codeception/CodeceptJS/issues/914 
    page.__evaluate = page.evaluate;
    page.evaluate = (async function () {
      try {
        return await this.__evaluate.apply(this, arguments);
      } catch (e) {
        let page = this, args = arguments;
        if (
          /Cannot find context with specified id undefined/.test(e.message)
          || /Execution context was destroyed, most likely because of a navigation/.test(e.message)) {
          process.nextTick(function () {
            page.evaluate.apply(page, args);
          });
        } else if (/Target closed/.test(e.message)) {
          await BrowserFactory.markUnavailable(page.__context.key, page.__context.id, true);
        } else if (/Session closed/.test(e.message)) {
          //do nothing
        } else {
          throw e;
        }
      }
    }).bind(page);


    let mainFrame = await page.mainFrame();
    // 页面加载完成后更新context
    page.on('framenavigated', function (frame) {
      let url = frame.url();
      if (frame === mainFrame) {
        let lastIdx, extraHeaders = {};
        if ((lastIdx = url.lastIndexOf('@')) >= 0) {
          let subStr = url.substr(lastIdx + 1);
          try {
            JSON.parse(decodeURIComponent(subStr));
            url = url.replace('@' + subStr, '');

            let eHeaders = JSON.parse(decodeURIComponent(subStr));
            for (let k in eHeaders) {
              if (eHeaders.hasOwnProperty(k)) {
                extraHeaders[k.toLowerCase()] = eHeaders[k];
              }
            }
          } catch (e) {
            NestiaWeb.logger.warn('Error parse extra header data:' + url, e);
          }
        }
        if (extraHeaders['x-proxy-https'] === '1') {
          url = url.replace(/^http:/, 'https:');
        }
        page.__context.url = url;
      }

    });
    await page.setUserAgent(page.__context.ua);
    await page.setViewport(page.__context.viewport);
    // 为页面设置指定的宽度高度，以及chrome的内部变量
    let setHackAttributes = function () {
      page.evaluate((viewport, props) => {
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
        if (props) {
          if (typeof props.chrome !== 'undefined') {
            try {
              window.__defineGetter__('chrome', function () {
                return props.chrome;
              });
            } catch (e) {
            }
          }
          if (typeof props.platform !== 'undefined') {
            navigator.__defineGetter__('platform', function () {
              return props.platform;
            });
          }

        }
      }, page.__context.viewport, page.__context.properties).then(() => {
      }).catch(async (e) => {
        if (/Target closed/.test(e.message)) {
          // 如果target closed，说明页面已经被意外关闭，大概率是因为浏览器崩溃，或者puppeteer内部错误，此时关闭浏览器是最佳选择。
          await BrowserFactory.markUnavailable(page.__context.key, page.__context.id, true);
          NestiaWeb.logger.error('Error fake resolution:' + e.message, e);
        } else if (/Session closed/.test(e.message)) {
          //do nothing
          NestiaWeb.logger.error('Error fake resolution:' + e.message, e);
        }
      });
    };
    // await page.waitFor('html');
    setHackAttributes();
    page.on('request', function () {
      setHackAttributes();
    });

    return page;
  },
  getStaticPage: async function (code) {
    "use strict";
    // 此方法用于从不会被销毁的浏览器实例中创建一个页面。
    // 从BrowserFactory 中获得browser实例
    const BrowserFactory = Browser.getBrowserFactory();
    const browser = BrowserFactory.getStaticBrowser(code);
    if (!browser) {
      NestiaWeb.logger.error('Fail to get static browser:' + code);
      return null;
    }
    //创建新页面
    const page = await browser.newPage();
    page.__context = Object.assign({}, browser.__context);
    page.__context.url = '';

    //fix "Cannot find context with specified id undefined" problem
    // @see https://github.com/Codeception/CodeceptJS/issues/914 
    page.__evaluate = page.evaluate;
    // 覆盖evaluate方法，用于修复puppeteer内部缺陷
    page.evaluate = (async function () {
      try {
        return await this.__evaluate.apply(this, arguments);
      } catch (e) {
        let page = this, args = arguments;
        if (
          /Execution context was destroyed, most likely because of a navigation./.test(e.message)
          || /Cannot find context with specified id undefined/.test(e.message)
        ) {
          process.nextTick(function () {
            page.evaluate.apply(page, args);
          });
        } else {
          throw e;
        }
      }
    }).bind(page);

    //设置消息拦截
    await page.setRequestInterception(true);
    await page.setExtraHTTPHeaders({
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
    });
    let mainFrame = await page.mainFrame();
    //页面加载后更新context
    page.on('framenavigated', function (frame) {
      let url = frame.url();
      if (frame === mainFrame) {
        let lastIdx, extraHeaders = {};
        if ((lastIdx = url.lastIndexOf('@')) >= 0) {
          let subStr = url.substr(lastIdx + 1);
          try {
            JSON.parse(decodeURIComponent(subStr));
            url = url.replace('@' + subStr, '');

            let eHeaders = JSON.parse(decodeURIComponent(subStr));
            for (let k in eHeaders) {
              if (eHeaders.hasOwnProperty(k)) {
                extraHeaders[k.toLowerCase()] = eHeaders[k];
              }
            }
          } catch (e) {
            NestiaWeb.logger.warn('Error parse extra header data:' + url, e);
          }
        }
        if (extraHeaders['x-proxy-https'] === '1') {
          url = url.replace(/^http:/, 'https:');
        }
        page.__context.url = url;
      }

    });
    //设置指定的浏览器参数
    await page.setUserAgent(page.__context.ua);
    await page.setViewport(page.__context.viewport);

    let setHackAttributes = function () {
      page.evaluate((viewport, props) => {
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
        if (props) {
          if (typeof props.chrome !== 'undefined') {
            try {
              window.__defineGetter__('chrome', function () {
                return props.chrome;
              });
            } catch (e) {
            }
          }
          if (typeof props.platform !== 'undefined') {
            navigator.__defineGetter__('platform', function () {
              return props.platform;
            });
          }

        }
      }, page.__context.viewport, page.__context.properties).then(() => {
      }).catch((e) => {
        if (!/Session closed|Target closed/.test(e.message)) {
          NestiaWeb.logger.error('Error fake resolution:' + e.message, e);
        }
      });
    };
    setHackAttributes();
    page.on('request', function () {
      setHackAttributes();
    });
    return page;
  },
  releasePage: async function (job, page, closeBrowser) {
    "use strict";
    let pageContext = page.__context;
    try {
      page.__context.released = true;
      page.removeAllListeners && page.removeAllListeners();

    } catch (e) {
      NestiaWeb.logger.error('Error remove page event[' + page.__context.key + ']:' + e.message, e);
    }
    try {
      await page.close();
    } catch (e) {
      NestiaWeb.logger.warn('Error closing page:' + e.message, e);
    }
    try {
      if (closeBrowser) {
        const BrowserFactory = Browser.getBrowserFactory();
        await BrowserFactory.markUnavailable(pageContext.key, pageContext.id, true);
        NestiaWeb.logger.warn(' closing browser:');
      }
    } catch (e) {
      NestiaWeb.logger.warn('Error closing browser:' + e.message, e);
    }
  },
  releaseStaticPage: async function (page) {
    "use strict";
    page.removeAllListeners && page.removeAllListeners('framenavigated');
    try {
      await page.close();
    } catch (e) {
      NestiaWeb.logger.warn('Error closing page:' + e.message, e);
    }
  }

};