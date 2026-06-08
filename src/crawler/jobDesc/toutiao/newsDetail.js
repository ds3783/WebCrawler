import base from './base.js';


const sleep = function (time) {
    return new Promise((resolve => {
        setTimeout(function () {
            resolve();
        }, time);
    }));
};

export default Object.assign({}, base, {
    isJobDesc: true,
    getNavigateOptions: function () {
        return {waitUntil: 'domcontentloaded'};
    },
    validateSuccess: async function (page) {
        let startTime = Date.now();
        while (true) {
            let length1 = await page.evaluate(function () {
                return document.getElementsByClassName('article-content').length;
            });
            let length2 = await page.evaluate(function () {
                return document.getElementsByClassName('galleryBox').length;
            });
            if (length1 + length2 > 0) {
                return true;
            }
            //timeout
            if (Date.now() - startTime > 30000) {
                return false;
            }
        }
    },
    getResult: async function (page) {
        return await page.evaluate(() => {
            var content = document.getElementsByClassName('article-content');
            if (content.length === 0) {
                content = document.getElementsByClassName('galleryBox');
            }

            return content[0].innerHTML;
        });
    }
});