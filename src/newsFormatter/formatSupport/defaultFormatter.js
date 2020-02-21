const Browser = require('../../browser');
const NestiaWeb = require('nestia-web');
const Template = require('./template');
const DefaultS2HFormatter = require('./defaultSource2HTML');

const formatter = {
    newPage: async function (job) {
        const BrowserFactory = Browser.getBrowserFactory();
        let browser = await BrowserFactory.borrow(job);
        return await browser.newPage();
    },
    fetchContent: async function (page, job, BROWSER_SCRIPTS) {

        await page.goto('about:blank');
        // page.injectJQuery
        await page.evaluate(jsContent => {
            var script = document.createElement('script');
            script.innerHTML = jsContent;
            document.head.appendChild(script);
        }, BROWSER_SCRIPTS['jquery-3.3.1.min.js']);

        page.on('console', async msg => {
            let messages = ['[CONSOLE] '];
            for (let arg of msg.args()) {
                messages.push(await arg.jsonValue());
            }
            NestiaWeb.logger.info.apply(NestiaWeb.logger.info, messages);
        });

        //format source HTML
        let html = DefaultS2HFormatter(job.source);
        job.isChinese = job.source.language_id === 2;
        // page.injectSourceHTML
        await page.evaluate(html => {
            var div = document.createElement('div');
            div.innerHTML = html;
            document.body.appendChild(div);
            var id = '__working_root', idx = 0;
            while (document.getElementById(id)) {
                id = '__working_root_' + idx;
                idx++;
            }

            div.setAttribute('id', id);
            window.__NESTIA_DEFRAG_ID__ = id;
        }, html);
    },
    releasePage: async function (page, job) {
        return await page.close();
    }
};


module.exports = Object.assign({}, Template, formatter);