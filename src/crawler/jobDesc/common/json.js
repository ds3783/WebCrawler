const base = require('./base');
const util = require("../../../misc/util");


module.exports = Object.assign({}, base, {
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
                    return false;
                }
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