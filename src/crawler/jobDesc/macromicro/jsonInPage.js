const base = require('./base');
const util = require("../../../misc/util");


module.exports = Object.assign({}, base, {
    isJobDesc: true,
    resultJsonObject:null,
    getNavigateOptions: function () {
        return {waitUntil: 'domcontentloaded'};
    },
    validateSuccess: async function (page) {
        let timeout = Date.now() + 200000;
        while (Date.now() < timeout) {
            try {
                // Get page HTML content
                const htmlContent = await page.content();

                // Search for pattern: JSON.parse(atob("base64string"))
                // This regex captures the base64 string inside atob("")
                const regex = /JSON\.parse\(atob\(["']([A-Za-z0-9+/=]+)["']\)\)/g;
                const matches = htmlContent.matchAll(regex);

                for (const match of matches) {
                    if (match[1]) {
                        try {
                            // Decode base64 string (Node.js equivalent of atob)
                            const decodedStr = Buffer.from(match[1], 'base64').toString('utf-8');
                            // Parse JSON and set to resultJsonObject
                            this.resultJsonObject = JSON.parse(decodedStr);
                            return true;
                        } catch (e) {
                            // If decode/parse fails, try next match
                            console.error('Failed to decode/parse JSON:', e.message);
                        }
                    }
                }

                // If no match found, wait a bit and retry
                await util.sleep(500)
            } catch (error) {
                console.error('Error in validateSuccess:', error);
            }
        }
        return false;

    },
    getResult: async function (page) {
        return this.resultJsonObject;
    }
});