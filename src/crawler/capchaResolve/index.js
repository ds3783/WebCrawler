import dama2 from './dama2.js';

let platforms = {
    dama2
};

export default {
    resolve: async function (platform, captcha) {
        "use strict";
        return await platforms[platform].resolve(captcha);
    }
}