const config = require('../../shared/utils/config');
const logger = require('../../shared/utils/logger');

class SunoCookie {
    constructor() {
        this.cookie = null;
    }

    loadCookie(cookieStr) {
        this.cookie = cookieStr;
        logger.info('Cookie loaded successfully');
    }

    getCookie() {
        return this.cookie;
    }

    getAuthHeaders() {
        return {
            'Cookie': this.cookie,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://suno.com',
            'Origin': 'https://suno.com'
        };
    }
}

const sunoAuth = new SunoCookie();
sunoAuth.loadCookie(config.musicGen.sunoCookie);

module.exports = sunoAuth;