const config = require('../utils/config');
const logger = require('../utils/logger');

class SunoCookie {
    constructor() {
        this.sessionId = null;
        this.cookie = null;
    }

    loadCookie(cookieStr) {
        this.cookie = cookieStr;
    }

    getCookie() {
        return this.cookie;
    }

    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }

    getSessionId() {
        return this.sessionId;
    }

    getAuthHeaders() {
        return {
            'Cookie': `session_id=${this.sessionId}; ${this.cookie}`,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Referer': 'https://suno.com',
            'Origin': 'https://suno.com'
        };
    }
}

const sunoAuth = new SunoCookie();
sunoAuth.setSessionId(config.audioGen.sessionId);
sunoAuth.loadCookie(config.audioGen.sunoCookie);

module.exports = sunoAuth;