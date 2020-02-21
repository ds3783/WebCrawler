const PageFactory = require('../browser/pageFactory');
const SessionState = require('./sessionState');
const NestiaWeb = require('nestia-web');
const Session = require('./session');

const BROWSER_KEY = 'MOVIE_AGENT';
const MAX_SURVIVE_TIME = 30 * 60 * 1000;

let sessions = {};

let validateSessions = function (SessionManager) {
    let now = Date.now();
    NestiaWeb.logger.debug('sessions', Object.keys(sessions).length);
    for (let id in sessions) {
        let session = sessions[id];
        NestiaWeb.logger.debug(`now[${now}] session[${id}]`, session._create_time, ` now-session:${now - session._create_time}`);
        if (now - session._create_time > MAX_SURVIVE_TIME) {
            NestiaWeb.logger.info(`Session[${id}] is closed due to long time no use.`);
            SessionManager.closeSession(id);
        }
    }
};

module.exports = {
    init: function () {
        sessions = {};
        let $this = this;
        setInterval(function () {
            validateSessions($this);
        }, 3000);
    },
    openSession: async function (sessionId, cinema, bookingUrl) {
        if (sessions[sessionId]) {
            NestiaWeb.logger.warn(`Session[${sessionId}] already exists, cannot reopen.`);
            return {
                id: null,
            }
        }

        let page = await PageFactory.getStaticPage(BROWSER_KEY);
        let sessionParams = {
            id: sessionId,
            page: page,
            state: SessionState.INIT,
            cinema: cinema,
            bookingUrl: bookingUrl,
        };
        let session = Session(sessionParams);
        session._create_time = Date.now();
        sessions[sessionId] = session;
        NestiaWeb.logger.info(`Session[${sessionId}] is created.`);
        return session;
    },
    getSession: function (id) {
        return sessions[id];
    },
    closeSession: function (id) {
        let session = sessions[id];
        if (session) {
            session.close();
            PageFactory.releaseStaticPage(session.page);
            delete sessions[id];
            NestiaWeb.logger.info(`Session[${id}] is closed.`);
        }
    }
};