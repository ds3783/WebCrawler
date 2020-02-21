const crypto = require('crypto');
const fs = require('fs');
const NestiaWeb = require('nestia-web');

// const baseUrl = 'http://api.dama2.com:7766/app/';
const baseUrl = 'http://dama2proxy.com/app/';
const TIMEOUT = 20;//seconds
const KEY = '5b68c73d05b1ec2fcdf9f68660aab5b8';
const USERNAME = 'nestia';
const PWD = 'nestia123';
const APP_ID = '45475';

let md5 = function (str) {
    "use strict";
    let md5sum = crypto.createHash('md5');
    md5sum.update(str);
    return md5sum.digest('hex');
};

let getPwd = function () {
    return md5(KEY + md5(md5(USERNAME) + md5(PWD)));
};

let getSign = function (binaryData) {
    "use strict";
    let md5sum = crypto.createHash('md5');
    md5sum.update(KEY);
    md5sum.update(USERNAME);

    // let fileContent=fs.readFileSync(captcha);
    md5sum.update(binaryData);
    return md5sum.digest('hex').substr(0, 8);
};

module.exports = {
    resolve: async function (captcha) {
        "use strict";
        let binaryData = fs.readFileSync(captcha);
        try {
            let data = await NestiaWeb.ajax.request({
                server: 'crawler',
                path: '/dama-file',
                method: 'POST',
                dataType: 'binary',
                contentType: 'json',
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Host': 'dev.crawler.corp.nestia.com',
                },
                data: binaryData
            });
            return data.data && data.data.result;
        } catch (e) {
            NestiaWeb.logger.error(e.message, e);
        }
    }
};