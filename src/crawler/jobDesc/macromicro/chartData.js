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
        // console.log('response.url()',response.url());
        if (/\/charts\/data\/\d+/.test(response.url())) {
            // console.log('Match!',response.url())
            let jsonObj = JSON.parse(content);
            // console.log('get obj!', jsonObj);
            if (jsonObj && jsonObj.data) {
                let keys = Object.keys(jsonObj.data);
                if (keys.length > 0) {
                    let key = keys[0];
                    let data = jsonObj.data[key];
                    // console.log('get data!', data);
                    if (data && data.series && data.series.length > 0) {
                        this.resultObj = data;
                    }
                }
            }

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
        return JSON.stringify(this.resultObj);
    }
});