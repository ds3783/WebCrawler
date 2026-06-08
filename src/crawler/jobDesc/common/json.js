import base from './base.js';
import util from '../../../misc/util.js';
import NestiaWeb from 'nestia-web';

export default Object.assign({}, base, {
    isJobDesc: true,
    getNavigateOptions: function () {
        return {waitUntil: 'domcontentloaded'};
    },
    validateSuccess: async function (page) {
        let timeout = Date.now() + 200000;
        while (Date.now() < timeout) {
            let valid = await page.evaluate(() => {

                try {
                    JSON.parse(document.body.innerHTML);
                    return true;
                } catch (e) {
                    //try with <pre>JSON STRING</pre> form
                    const preMatch = document.body.innerHTML.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
                    let jsonString='';
                    if (preMatch && preMatch[1]) {
                        jsonString = preMatch[1].trim();
                    }
                    if (jsonString) {
                        try {
                            JSON.parse(document.body.innerHTML);
                            return true;
                        } catch (e) {
                            return false;
                        }
                    }else{
                        return false;
                    }
                }
            });
            if (valid) {
                return true;
            } else {
                await util.sleep(500);
            }
        }
        let html = await page.evaluate(() => {
            return document.body.innerHTML;
        });
        NestiaWeb.logger.info('Failed to parse page', html?.length > 500 ? html.substring(0, 500) : html);
        return false;

    },
    getResult: async function (page) {
        return await page.evaluate(() => {
            return document.body.innerHTML;
        });
    }
});