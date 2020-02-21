const base = require('./base');


const sleep = function (time) {
    return new Promise((resolve => {
        setTimeout(function () {
            resolve();
        }, time);
    }));
};

module.exports = Object.assign({}, base, {
    isJobDesc: true,
    validateSuccess: async function (page) {
        let length1 = await page.evaluate(function () {
            return document.getElementsByClassName('article-content').length;
        });
        let length2 = await page.evaluate(function () {
            return document.getElementsByClassName('galleryBox').length;
        });
        return length1 + length2 > 0;
    },
    getResult: async function (page) {
        return await page.evaluate(() => {
            return document.body.innerHTML;
        });
    }
});