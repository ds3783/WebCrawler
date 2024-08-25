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
    resultObj: false,
    responseFilter: function (response, content) {
        console.log('response.url()',response.url());
        if (/api\.debank\.com\/user\?id=/.test(response.url())) {
            console.log('YES',content);
            this.resultObj = content;
        }
        return true;
    },
    getNavigateOptions: function () {
        return {waitUntil: 'domcontentloaded'};
    },
    validateSuccess: async function (page) {
        let startTime = Date.now();
        while (true) {
            if (this.resultObj) {
                return true;
            }
            //timeout
            if (Date.now() - startTime > 20000) {
                page.reload();
            }
            if (Date.now() - startTime > 30000) {
                return false;
            }
            await sleep(300);
        }
    },
    getResult: async function (page) {
        return this.resultObj;
    }
});