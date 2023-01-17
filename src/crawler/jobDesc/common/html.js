const base = require('./base');


module.exports = Object.assign({}, base, {
    isJobDesc: true,
    getNavigateOptions: function () {
        return {waitUntil: 'domcontentloaded'};
    },
    validateSuccess: async function (page) {
        return await page.evaluate(() => {
            return 'complete' === document.readyState;
        });

    },
    getResult: async function (page) {
        return await page.evaluate(() => {
            return document.body.innerHTML;
        });
    }
});