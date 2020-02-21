module.exports = {
    initialJob: function (job) {
        job.headlessBrowser = true;
    },
    setPageContext: async function (page) {
    },
    validateCaptcha: async function (ignorePage) {
        "use strict";
        return false;
    },
    waitForNetIdle: function () {
        return false;
    },
    requestFilter: function (request) {
        "use strict";
        let url = request.url();
        // return true;
        let validDomain = (/^(http(s)?:\/\/[^\/]*toutiao\.com\/.*)|(http(s)?:\/\/[^\/]*pstatp\.com\/.*)|(http(s)?:\/\/[^\/]*moatads\.com\/.*)$/.test(url));
        let invalidFile = /(\.gif|\.png|\.jpg|\.svg)(\?.*)?$|\/collector|\/dfic-imagehandler|\/large|\/pgc-image\//.test(url);
        let result = validDomain && (!invalidFile);
        // console.log(url,result?'passed':'blocked',validDomain,invalidFile);
        return result;

    },
    validateSuccess: async function (page) {
        "use strict";
        let count = await page.evaluate(function () {
            return document.getElementsByClassName('hub-main').length;
        });
        return count > 0;
    }
};