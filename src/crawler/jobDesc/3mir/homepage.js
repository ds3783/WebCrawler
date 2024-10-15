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

    initialJob: function (job) {
        job.direct_proxy = true;
        job.headlessBrowser = true;
        this.url = job.url;
        this.timeout = job.timeout || 30000;
        job.url = 'about:blank';
    },
    getNavigateOptions: function () {
        return {waitUntil: 'domcontentloaded'};
    },
    validateSuccess: async function (page) {
        await page.evaluate((url) => {
            if (/about:blank/.test(location.href)) {
                location.href = url;
            }
        }, this.url);
        let interval = setInterval(async () => {
            await page.evaluate(() => {
                if (!window.__injected && window && window.location) {


                    // Save the original location.href
                    const originalLocationHref = window.location.href;
                    for (let method of ['assign', 'replace', 'reload']) {
                        location[method] = () => {
                        };
                    }
                    window.addEventListener('beforeunload', function (event) {
                        event.preventDefault();
                        // Optionally display a message
                        // event.returnValue = ''; // This shows a confirmation dialog in most browsers
                    });
                    history.back = () => {
                    };
                    history.go = () => {
                    };
                    // location.replace=()=>{}; 
                    window.__injected = true;
                }

            });
        }, 100);
        let startTime = Date.now();
        let result = false;
        while (true) {
            let hashtml = await page.evaluate(() => {
                return document.documentElement?.outerHTML;
            });

            if (hashtml) {
                if (hashtml.indexOf('香港中文大学') > -1) {
                    result = true;
                    break;
                }
            }
            if ((Date.now() - startTime) > (this.timeout || 30000)) {
                break;
            }
            await sleep(300);
        }
        clearInterval(interval);
        return result;

    },
    getResult: async function (page) {
        return await page.evaluate(() => {
            return document.querySelector('html').innerHTML;
        });
    }
});