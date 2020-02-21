const defaultFormatter = require('./defaultFormatter');
const wechatFormatter = require('./wechatFormatter');


module.exports = {
    getFormatter: function (params) {
        switch (params.format) {
            case 'wechat':
                return wechatFormatter;
            default:
                return defaultFormatter;
        }
    }
};