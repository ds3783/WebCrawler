//Session manager
const SessionManager = require('./sessionManager');

const NestiaWeb = require('nestia-web');


module.exports = {
    init: function () {
        let movieAgentConfig = NestiaWeb.manifest.get('staticBrowsers.MOVIE_AGENT');
        if (movieAgentConfig.enabled) {
            SessionManager.init();
        }
    },
    openSession: async function (sessionId, cinema, bookingUrl) {
        return await SessionManager.openSession(sessionId, cinema, bookingUrl);
    },
    getSession: function (id) {
        return SessionManager.getSession(id);
    },
    closeSession: function (id) {
        return SessionManager.closeSession(id);
    }
};