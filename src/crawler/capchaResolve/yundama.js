const crypto = require('crypto');
const fs = require('fs');
const NestiaWeb = require('nestia-web');

// const baseUrl = 'http://api.dama2.com:7766/app/';
const requestUrl = 'http://api.yundama.com/api.php';
const resultUrl = 'http://api.yundama.com/api.php';
const KEY = '5b68c73d05b1ec2fcdf9f68660aab5b8';
const USERNAME = 'ds3783';
const PWD = 'KX9LcZG7c9';
const CODE_TYPE = '1014';
const APP_ID = '1';
const APP_KEY = '22cc5376925e9387a23cf797cb9ba745';
const TIMEOUT = '25';

let md5 = function (str) {
    "use strict";
    let md5sum = crypto.createHash('md5');
    md5sum.update(str);
    return md5sum.digest('hex');
};

let getPwd = function () {
    return md5(KEY + md5(md5(USERNAME) + md5(PWD)));
};

let sleep = async function (seconds) {
    "use strict";
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve();
        }, seconds * 1e3);
    })
};

module.exports = {
    resolve: async function (captcha) {
        "use strict";
        let binaryData = fs.readFileSync(captcha);
        try {
            let data = await NestiaWeb.ajax.request({
                url: requestUrl,
                method: 'POST',
                dataType: 'multipart',
                contentType: 'json',
                timeout: 100000,
                headers: {
                    // 'Content-Type': 'application/www-form-urlencoded',
                    // 'User-Agent': 'Nestia Web Server V1.0',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',
                    'Accept': 'text/html,application/json',
                    'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4',
                },
                data: {
                    username: USERNAME,
                    password: PWD,
                    codetype: CODE_TYPE,
                    appid: APP_ID,
                    appkey: APP_KEY,
                    timeout: TIMEOUT,
                    file: {
                        name: (Math.floor(Math.random() * 1000)) + '.png',
                        binary: binaryData,
                    },
                    method: 'upload'
                }
            });
            if (!data || !data.data || data.data.ret !== 0) {
                if (data.data && data.data.ret) {
                    NestiaWeb.logger.error('Yundama error:' + data.data.ret);
                    NestiaWeb.logger.error('fullResponse:' + JSON.stringify(data, null, ''));
                } else {
                    NestiaWeb.logger.error('Yundama error:' + (data ? JSON.stringify(data, null, '') : data));
                }
                return null;
            }
            let cid = data.data.cid;
            NestiaWeb.logger.info('Yundama got cid:' + cid);

            let start = +new Date();
            let result, error;
            do {
                let tmpResult = await NestiaWeb.ajax.request({
                    url: resultUrl,
                    method: 'GET',
                    contentType: 'json',
                    timeout: 3000,
                    headers: {
                        'Content-Type': 'application/www-form-urlencoded',
                        'User-Agent': 'Nestia Web Server V1.0',
                    },
                    data: {
                        method: 'result',
                        cid: cid
                    }
                });
                NestiaWeb.logger.debug(tmpResult);
                if (tmpResult && tmpResult.data && tmpResult.data.ret === 0 && tmpResult.data.text) {
                    result = tmpResult.data.text;
                    break;
                }
                let now = +new Date();
                if (now - start > TIMEOUT * 1e3) {
                    error = 'timeout';
                    NestiaWeb.logger.error('Yundama timeout,cid:' + cid + ' image:' + captcha);
                    break;
                }
                await sleep(5);
            } while (true);
            return result;
        } catch (e) {
            NestiaWeb.logger.error(e.message, e);
        }
    }
};