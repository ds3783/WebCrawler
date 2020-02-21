const dama2 = require('./dama2');

let platforms = {
    dama2
};

module.exports = {
    resolve: async function (platform, captcha) {
        "use strict";
        return await platforms[platform].resolve(captcha);
    }
}