const path = require('path');
const NestiaWeb = require('nestia-web');
const EventEmitter = require('events').EventEmitter;
const PageFactory = require('../crawler/pageFactory');
const Browser = require('../browser');
const StatusShot = require('../crawler/diagnostic/statusShot');
const JobDesc = require('../crawler/jobDesc');
const utils = require('../crawler/utils');

let STATIC_DATA = [];

let constant = 'NESTIA ID,Bill To,Price,Invoice Data,Transaction ID,Order ID,Order Info,Order Detail,Ref,Holder Name,,,,,,,,,,,,,,,,,,\n' +
    '704998,489784xxxxxx7789,47.5,03/07/2019,03190703234108610815,021907032341085710215,Mobile Top Up	,Singtel Top up $20 - 91203104	      ,918415123797,SANDRA BELTH,,,,,,,,,,,,,,,,,,';

module.exports = {
    init: function () {
        let lines = constant.split('\n');
        for (let line of lines) {
            if (!/^\d/.test(line)) {
                continue;
            }
            let fields = line.split(',');
            let detail = fields[7];
            let img, phoneNo = '';
            if (/Promotion/.test(fields[6])) {
                img = 'https://nestia-static.s3-ap-southeast-1.amazonaws.com/promotion/bb_powder.png';
            } else if (/Grab/.test(fields[6])) {
                img = 'https://nestia-static.s3-ap-southeast-1.amazonaws.com/promotion/grab.png';
            } else {
                if (/Singtel/.test(detail)) {
                    img = 'https://nestia-static.s3-ap-southeast-1.amazonaws.com/topup/Singtel-2.png';
                } else if (/StarHub/.test(detail)) {
                    img = 'https://nestia-static.s3-ap-southeast-1.amazonaws.com/topup/Starhub-2.png';
                } else if (/M1/.test(detail)) {
                    img = 'https://nestia-static.s3-ap-southeast-1.amazonaws.com/topup/M1-2.png';
                } else {
                    img = '';
                }
            }
            if (/Mobile/.test(fields[6]) && /- \d{8}/.test(detail)) {
                phoneNo = detail.replace(/^.*- (\d{8}).*$/, "$1");
                detail = detail.replace(/- \d{8}/, '').trim();
            }

            let data = {
                nestiaId: fields[0],
                billingTo: (fields[1] || '').trim(),
                holder: fields[9],
                ref: fields[8],
                invoiceDate: fields[3],
                price: 'S$' + (fields[2] || '').trim(),
                orderNo: fields[5],
                transactionId: fields[4],
                itemImg: img,
                orderInfo: (fields[6] || '').trim(),
                phoneNo: phoneNo,
                orderDetail: detail
            };
            if (!phoneNo) {
                delete data['phoneNo'];
            }
            STATIC_DATA.push(data);
        }
    },
    run: async function () {
        let job = {
            viewport: {width: 375, height: 812}
        };
        let page = await PageFactory.getPage(job);
        await page.setRequestInterception(true);
        for (let postData of STATIC_DATA) {

            let dataPoster = interceptedRequest => {

                if (/nestia.com\/receipt/.test(interceptedRequest.url())) {
                    // Here, is where you change the request method and 
                    // add your post data
                    let pd = [];
                    for (let key in postData) {
                        pd.push(encodeURIComponent(key) + '=' + encodeURIComponent((postData[key] || '').trim()));
                    }

                    let data = {
                        'method': 'POST',
                        'postData': pd.join('&'),
                        'headers': {
                            'content-type': 'application/x-www-form-urlencoded'
                        }
                    };
                    // Request modified... finish sending! 
                    interceptedRequest.continue(data);
                } else {
                    interceptedRequest.continue();
                }
            };
            page.on('request', dataPoster);
            await page.goto('http://payment-local.nestia.com/receipt', {
                waitUntil: 'networkidle0'
            });
            page.removeListener('request', dataPoster);
            let screenShotName = postData.ref + '.png';
            await page.screenshot({
                path: path.join('/Users/ds3783/Projects/nestia/feCrawler/data/r', screenShotName),
                type: 'png',
            });
        }
        PageFactory.releasePage(job, page);

    }
};