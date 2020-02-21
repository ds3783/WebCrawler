const NestiaWeb = require('nestia-web');

module.exports = {
    fillForm: async function (page, selector, value) {
        let position;
        do {
            position = await this.getElementPosition(page, selector);
            if (position && position.top + position.height > page.__context.viewport.height
                || position.left + position.width > page.__context.viewport.width
                || position.top < 0
                || position.left < 0) {
                await page.evaluate((left, top) => {
                    window.scrollTo(window.scrollX + left, window.scrollY + top);
                }, position.left, position.top);
            } else {
                break;
            }
        } while (true);
        if (position) {
            NestiaWeb.logger.debug('filling ' + selector);
            await page.type(selector, '' + value, {delay: 30});
            await this.sleep(100);
            NestiaWeb.logger.debug('filled ' + selector);
        }
    },
    sleep: function (time) {
        return new Promise((resolve => {
            setTimeout(function () {
                resolve();
            }, time);
        }));
    },
    getElementPosition: async function (page, selector) {
        return await page.evaluate((selector) => {
            var dom = document.querySelector(selector);
            if (dom) {
                var rect = dom.getBoundingClientRect();
                return {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                }
            }
            return null;
        }, selector);
    },
    getPaymentParams: async function (formParams) {
        let config;
        try {
            config = await NestiaWeb.config.getConfig(
                'movie_agent.json',
                'json',
            );
            config = JSON.parse(config.content);
            config = config['payment_cards'];
        } catch (e) {
            NestiaWeb.logger.error('Error getting movie agent config:', e.message, e);
            throw e;
        }
        let defaultPayment = config[Math.floor(Math.random() * config.length)];
        let payment = Object.assign({}, defaultPayment, formParams || {});
        const REQUIRED_KEYS = ['name', 'email', 'phone', 'card_no', 'card_holder', 'card_expiry', 'security_code'];
        for (let prop of REQUIRED_KEYS) {
            if (!payment[prop]) {
                throw new Error(`Missing required payment param:${prop}`);
            }
        }

        return payment;
    }
};