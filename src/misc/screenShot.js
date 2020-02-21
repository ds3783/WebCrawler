const path = require('path');
const NestiaWeb = require('nestia-web');
const EventEmitter = require('events').EventEmitter;
const PageFactory = require('../browser/pageFactory');
const Browser = require('../browser');
const StatusShot = require('../crawler/diagnostic/statusShot');
const JobDesc = require('../crawler/jobDesc');
const utils = require('../crawler/utils');

let STATIC_DATA = [];

module.exports = {
    init: function () {

    },
    run: async function () {
        let job = {
            viewport: {width: 750, height: 1260}
        };
        let page = await PageFactory.getPage(job);
        await page.setRequestInterception(false);
        await page.goto('http://topup-local.nestia.com/wechat/walletTopupResult?q=https%3A%2F%2Fd23r8i05s5zpof.cloudfront.net%2Fapp%2FWechatOffical.png', {
            waitUntil: 'load'
        });
        let screenShotName = 'sample.png';
        await page.screenshot({
            path: path.join('/Users/ds3783/Projects/nestia/feCrawler/data/r', screenShotName),
            type: 'png',
        });
        PageFactory.releasePage(job, page);

    }
};