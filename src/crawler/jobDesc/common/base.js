module.exports = {
    initialJob: function (job) {
        job.direct_proxy = true;
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
        
        let invalidFile = /(\.gif|\.png|\.jpg|\.svg)(\?.*)?$|\/collector|\/dfic-imagehandler|\/large|\/pgc-image\//.test(url);
        // console.log(url,result?'passed':'blocked',validDomain,invalidFile);
        return (!invalidFile);

    },
    validateSuccess: async function (page) {
        "use strict";
        let count = await page.evaluate(function () {
            return document.getElementsByClassName('hub-main').length;
        });
        return count > 0;
    }
};