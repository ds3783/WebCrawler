const BrowserFactory = require('./browserFactory');
const NestiaWeb = require('nestia-web');

let initialized = false;
let browserInitCallbacks = {};

module.exports = {
    init: async function () {
        await BrowserFactory.init(function (key) {
            NestiaWeb.logger.info(`Browser[${key}] initialized`);

            let callbacks = browserInitCallbacks[key];
            NestiaWeb.logger.info('Initializing static job:' + key + ' callback:' + (callbacks && callbacks.length));
            if (callbacks && callbacks.length) {
                for (let callback of callbacks) {
                    try {
                        callback && callback(key);
                    } catch (e) {
                        NestiaWeb.logger.info('Static job init failed:' + key, e);
                    }
                }
            }
        });
        initialized = true;
    },
    getBrowserFactory: function () {

        return BrowserFactory;
    },
    onBrowserReady: function (key, callback) {
        if (initialized) {
            NestiaWeb.logger.info('Initializing static job:' + key);
            try {
                callback && callback(key);
            } catch (e) {
                NestiaWeb.logger.info('Static job init failed:' + key, e);
            }
        } else {
            if (!browserInitCallbacks[key]) {
                browserInitCallbacks[key] = [];
            }
            browserInitCallbacks[key].push(callback);
        }
    }
};