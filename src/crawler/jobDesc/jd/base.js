module.exports = {
  initialJob: function (job) {
    job.headlessBrowser = false;
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
    // 仅允许京东域名下请求通过，并且阻止图片请求发出           
    let validDomain = (/^(http(s)?:\/\/[^\/]*jd\.com\/.*)|(http(s)?:\/\/[^\/]*360buyimg\.com\/.*)|(http(s)?:\/\/[^\/]*3\.cn\/.*)$/.test(url));
    let invalidFile = /(\.gif|\.png|\.jpg|\.svg)(\?.*)?$|\/collector|\/dfic-imagehandler|\/large|\/pgc-image\//.test(url);
    let result = validDomain && (!invalidFile);
    return result;

  }
};