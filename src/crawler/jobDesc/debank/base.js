module.exports = {
  initialJob: function (job) {
    job.direct_proxy = true;
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
};