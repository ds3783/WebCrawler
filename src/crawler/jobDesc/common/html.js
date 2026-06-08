import base from './base.js';
import util from '../../../misc/util.js';


export default Object.assign({}, base, {
    isJobDesc: true,
    getNavigateOptions: function () {
        return {waitUntil: 'domcontentloaded'};
    },
    validateSuccess: async function (page) {
        let timeout = Date.now() + 200000;
        while (Date.now() < timeout) {
            let valid = await page.evaluate(() => {
                let done= 'complete' === document.readyState || (document.body && document.body.innerText);
                let hasNode=document.querySelector('div.crawler');
                return done&&hasNode;
            });
            if (valid) {
                return true;
            } else {
                await util.sleep(500);
            }
        }
        return false;

    },
    getResult: async function (page) {
        return await page.evaluate(() => {
            return document.body.innerHTML;
        });
    }
});