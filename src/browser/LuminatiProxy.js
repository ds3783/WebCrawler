const NestiaWeb = require('nestia-web');

const LUMINATI_CONSOLE_PORT = 22999;

module.exports = {
    isLuminatiProxy: async function (proxyHost, proxyPort) {
        let url = `http://${proxyHost}:${LUMINATI_CONSOLE_PORT}/api/proxy_status/${proxyPort}`;
        try {
            let result = await NestiaWeb.ajax.request({
                url: url,
                method: 'GET',
            });
            return result.data && /^(ok|error)$/.test(result.data.status);
        } catch (e) {
            return false;
        }
    },
    changeProxy: async function (proxyHost, proxyPort) {
        let url = `http://${proxyHost}:${LUMINATI_CONSOLE_PORT}/api/refresh_sessions/${proxyPort}`;
        return NestiaWeb.ajax.request({
            url: url,
            method: 'POST',
        });
    },
};