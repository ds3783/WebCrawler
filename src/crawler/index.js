const jobExecutor = require('./jobExecutor');
const StatusShot = require('./diagnostic/statusShot');
const CaptchaCracker = require('./captchaCracker');
const utils = require('./utils');
const path = require('path');
const fs = require('fs');

const Browser = require('../browser');
const NestiaWeb = require('nestia-web');

// const R = require('../misc/generReceipts');
const R = require('../misc/screenShot');
const MAX_CRACK_RETRY = 3;
const COOL_DOWN_TIME = 300 * 1e3; //5min cd


/*
const defaultResult = {
    result: false,
    message: '',
    data: {}
};
*/

let domainStatus = {};

let crackCaptcha = function (context) {
    "use strict";
    let domain = utils.getDomain(context.url);
    let key = utils.getProxyKey(context) + '_' + domain;
    if (!domainStatus[key]) {
        domainStatus[key] = {
            context: context,
            status: 'captcha_required',
            lastUpdateTime: +new Date(),
            retryTimes: 0,
            domain: domain
        };
    }
    CaptchaCracker.crack(context);
};

let resumeCraw = function (context) {
    "use strict";
    let key = utils.getProxyKey(context) + '_' + utils.getDomain(context.url);
    delete domainStatus[key];
};


let staticJobs = {};

(function () {
    "use strict";
    let dir = path.join(__dirname, 'staticJob');

    let files = fs.readdirSync(dir);
    for (let file of files) {
        let fullPath = path.join(dir, file);
        let fileState = fs.lstatSync(fullPath);
        if (!fileState.isDirectory() && /^.*\.js$/.test(file)) {
            let job = require(fullPath);
            staticJobs[job.key] = job;
        }
    }

})();


module.exports = {
    init: function () {
        "use strict";
        StatusShot.init();
        CaptchaCracker.init();
        jobExecutor.on('captcha_required', function (job) {
            crackCaptcha(job);
        });
        CaptchaCracker.on('success', function (context) {
            resumeCraw(context);
        });
        CaptchaCracker.on('fail', function (context) {
            let key = utils.getProxyKey(context) + '_' + utils.getDomain(context.url);
            let status = domainStatus[key];
            if (status) {

                status['retryTimes']++;
                status['lastUpdateTime'] = +new Date();
                if (status['retryTimes'] < MAX_CRACK_RETRY) {
                    crackCaptcha(context);
                } else {
                    //Sleep for sometime and reopen craw window
                    setTimeout(function () {
                        resumeCraw(context);
                    }, COOL_DOWN_TIME);
                }

            } else {
                //time out or something wired happened
                resumeCraw(context);
            }

        });


        setInterval(function () {
            let now = +new Date();
            let expired = [];
            for (let key in domainStatus) {
                if (!domainStatus.hasOwnProperty(key)) {
                    continue;
                }
                let status = domainStatus[key];
                if (now - status['lastUpdateTime'] > COOL_DOWN_TIME) {
                    expired.push(key);
                }
            }
            for (let key of expired) {
                NestiaWeb.logger.info('Captcha info expried ,delete: ' + JSON.stringify(domainStatus[key], null, ''));
                delete domainStatus[key];
            }
        }, 60 * 1e3);

        for (let key in staticJobs) {
            if (staticJobs.hasOwnProperty(key)) {
                Browser.onBrowserReady(key, staticJobs[key].init);
            }
        }

        /*R.init();
        R.run();*/
    },
    status: function () {
        "use strict";

        let jobs = jobExecutor.listJobs();
        let jList = [];
        let now = +new Date();
        for (let job of jobs) {
            jList.push({
                id: job.id,
                url: job.url,
                status: job.status,
                runtime: now - job.startTime
            });
        }
        return {
            status: 'ok',
            runningJobs: jList
        }
    },
    registerCallback: function (jobId, callback) {
        "use strict";
        jobExecutor.registerCallback(jobId, callback);
    },
    unregisterCallback: function (jobId) {
        "use strict";
        jobExecutor.unregisterCallback(jobId);
    },
    start: function (context) {
        "use strict";
        let key = utils.getProxyKey(context) + '_' + utils.getDomain(context.url);

        return jobExecutor.startJob(context, domainStatus[key]);
    },
    generateId: function () {
        "use strict";
        return jobExecutor.generateId();

    },
    startStaticJob: function (code, param) {
        let job = staticJobs[code];
        return job.execute(param.params);
    }
};