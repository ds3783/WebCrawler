const base = require('./base');


const sleep = function (time) {
    return new Promise((resolve => {
        setTimeout(function () {
            resolve();
        }, time);
    }));
};

module.exports = Object.assign({}, base, {
    isJobDesc: true,
    getNavigateOptions: function () {
        return {waitUntil: 'domcontentloaded'};
    },
    validateSuccess: async function (page) {
        let startTime = Date.now();
        while (true) {
            let priceText = await page.evaluate(function () {
                var priceSpan = document.querySelector('.summary-price-wrap .p-price .price');
                return priceSpan && priceSpan.innerHTML;
            });
            if (('' + priceText).trim()) {
                return true;
            }
            //timeout
            if (Date.now() - startTime > 30000) {
                return false;
            }
        }
    },
    getResult: async function (page) {
        return await page.evaluate(() => {
            var nameSpan = document.querySelector('.sku-name');
            var priceSpan = document.querySelector('.summary-price-wrap .p-price .price');
            return {
               name:nameSpan.innerText,
               price:priceSpan.innerText 
            };
        });
    }
});