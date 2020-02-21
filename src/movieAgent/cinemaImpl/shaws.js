const NestiaWeb = require('nestia-web');
const utils = require('../utils');

/*EL_HDS 残疾人
EL_STS  普通座
EL_SCR  屏幕
EL_LBL  Label
EL_EXT  Exit
EL_TOL_M  厕所标识符
EL_ENT  Entrance
*/
// $('.table-confirm:contains("temporary unavailable")').length  not available

/*'NONE|EMPTY|SELECTED|SOLD|UNAVAILABLE'*/

const SEAT_TYPE_MAPPING = {
    'AV': 'EMPTY',
    'SO': 'SOLD',
};


const extractMovieInfo = async function (page) {
    return await page.evaluate(function () {
        var MPAA_MAPPING = {
            'sprite-legends-rating-g': 'G',
            'sprite-legends-rating-pg': 'PG',
            'sprite-legends-rating-pg13': 'PG13',
            'sprite-legends-rating-nc16': 'NC16',
            'sprite-legends-rating-m18': 'M18',
            'sprite-legends-rating-r21': 'R21',
            // 'sprite-legends-rating-nar': 'NAR',  NOT EXISTS
        };
        var cover = jQuery('.block-img img').attr('src');
        var info = jQuery('.info');
        var pgClass = info.find('.title div:first');
        if (pgClass.length > 0) {
            pgClass = Array.from(pgClass[0].classList).filter(function (name) {
                return /legends/.test(name);
            })[0];
        }
        var title = jQuery.trim(info.find('.title').text());
        var otherInfo = info.children('p');
        var cinemaAndHall = jQuery.trim(otherInfo.eq(0).text());
        var dateStr = jQuery.trim(otherInfo.eq(1).text());
        var timeStr = jQuery.trim(otherInfo.eq(2).text());
        var unavailable = jQuery('.table-confirm:contains("temporary unavailable")').length > 0;
        return {
            title: title,
            cover: cover,
            available: !unavailable,
            mpaaRating: MPAA_MAPPING[pgClass],
            cinema:
            cinemaAndHall,
            time:
                (new Date([dateStr, timeStr, 'GMT+8'].join(' '))).getTime(),
        }
            ;
    });
};

const extractSeats = function (url, content) {

    let jsonContent;
    try {
        jsonContent = JSON.parse(content);
    } catch (e) {
        NestiaWeb.logger.error('Error parse shaws seats json:', e);
        return;
    }
    let items = jsonContent.Items || [];
    let minX, minY, maxX, maxY;
    const X_PADDING = 17, Y_PADDING = 25;
    for (let item of items) {
        if (['EL_HDS', 'EL_STS'].indexOf(item.element_code) >= 0 && item.element_offset_x > 0 && item.element_offset_y > 0) {
            if (typeof minX === 'undefined') {
                minX = item.element_offset_x;
            } else {
                minX = Math.min(minX, item.element_offset_x);
            }
            if (typeof maxX === 'undefined') {
                maxX = item.element_offset_x || undefined;
            } else {
                maxX = Math.max(maxX, item.element_offset_x);
            }
            if (typeof minY === 'undefined') {
                minY = item.element_offset_y || undefined;
            } else {
                minY = Math.min(minY, item.element_offset_y);
            }
            if (typeof maxY === 'undefined') {
                maxY = item.element_offset_y || undefined;
            } else {
                maxY = Math.max(maxY, item.element_offset_y);
            }
        }
    }
    if (
        typeof minX === 'undefined'
        || typeof minY === 'undefined'
        || typeof maxX === 'undefined'
        || typeof maxY === 'undefined'
    ) {
        NestiaWeb.logger.error('Unable to determine XY range:', minX, minY, maxX, maxY);
        return;
    }
    minX = Math.floor(minX);
    maxX = Math.ceil(maxX) + X_PADDING;
    minY = Math.floor(minY);
    maxY = Math.ceil(maxY) + Y_PADDING;
    let cols = Math.ceil((maxX - minX) / X_PADDING);
    let rows = Math.ceil((maxY - minY) / Y_PADDING);
    let result = {
        "rows": rows,
        "columns": cols,
        "seats": []
    };
    let cnt1 = 0, cnt2 = 0;
    for (let item of items) {
        if (['EL_HDS', 'EL_STS'].indexOf(item.element_code) >= 0 && item.element_offset_x > 0 && item.element_offset_y > 0) {
            item.col = Math.ceil((Math.floor(item.element_offset_x) - minX) / X_PADDING);
            item.row = Math.ceil((Math.floor(item.element_offset_y) - minY) / Y_PADDING);

            cnt1++;
        }
    }
    for (let x = 0; x < rows; x++) {
        let row = [];
        for (let y = 0; y < cols; y++) {
            let found = false;
            for (let item of items) {
                if (['EL_HDS', 'EL_STS'].indexOf(item.element_code) >= 0 && item.row === x && item.col === y) {
                    found = true;
                    let seatType;
                    if ('EL_HDS' === item.element_code) {
                        seatType = 'UNAVAILABLE';//wheel char seat set to unavailable
                    } else {
                        seatType = SEAT_TYPE_MAPPING[item.element_status_code];
                    }
                    row.push({
                        row: x,
                        col: y,

                        "type": "NONE, SEAT-SINGLE, SEAT-LEFT, SEAT-RIGHT , WALL, SCREEN",
                        "state": "EMPTY, SELECTED, SOLD, UNAVAILABLE",
                        rowName: item.element_row_reference,
                        colName: item.element_column_reference,
                        id: item.layout_element_code,
                    });
                    cnt2++;
                    break;
                }
            }
            if (!found) {
                row.push({
                    row: x,
                    col: y,

                    "type": "NONE, SEAT-SINGLE, SEAT-MIDDLE, SEAT-LEFT, SEAT-RIGHT , WALL, SCREEN",
                    "state": "EMPTY, SELECTED, SOLD, UNAVAILABLE",
                    rowName: '',
                    colName: '',
                    id: '__NONE_' + x + '_' + y,
                });
            }
        }
        result.seats.push(row);
    }
    return result;
};


const impl = {
    start: async function (sessionParam) {
        this._movieInfo = {};
        await this.page.goto(sessionParam.bookingUrl, {
            waitUntil: 'domcontentloaded'
        });
        await this.page.evaluate(function () {
            setTimeout(function () {
                setInterval(function () {
                    window.onbeforeunload = null;
                    if (!$ || !$.fn || !$.fn.FlipClock) {
                        if ($ && $.fn) {
                            $.fn.FlipClock = function () {
                            };
                        }
                    }
                }, 500);
                document.getElementById('countdownClock').style['display'] = 'none';
            }, 100);
            if ($ && $.fn) {
                $.fn.FlipClock = function () {
                };
            }
        });
        let movieInfo = await extractMovieInfo(this.page);
        this._movieInfo = Object.assign(this._movieInfo, movieInfo);
        this._seatSelected = false;
        this._paying = false;
        return movieInfo;
    },
    requestFilter: function (request) {
        let url = request.url();
        let blackList = false, whiteList = false;
        if (/http(s)?:\/\/([^\/]+)?shaw\.sg\/.*$/.test(url)) {
            whiteList = true;
        }
        if (/http(s)?:\/\/([^\/]+)?securecode\.com\/.*$/.test(url)) {
            whiteList = true;
        }

        if (/(\.gif|\.jpg|\.woff2|\.css)(\?.*)?$/.test(url)) {
            blackList = true;
        }
        if (/noimage\.png/.test(url)) {
            blackList = false;
        }
        if (/|\.css/.test(url)) {
            blackList = false;
        }
        if (/fbevents|anaylitcs/.test(url)) {
            blackList = false;
        }
        if (this._paying) {

            if (/\/(PaymentCheck)/.test(url)) {
                let reqHeaders = request.headers();
                let paymentCheckUrl = url;
                let cookies = reqHeaders['cookie'];
                if (!/^http/.test(paymentCheckUrl)) {
                    paymentCheckUrl = 'https://www.shaw.sg' + paymentCheckUrl;
                }
                this._cookie = this._cookie || [];
                this._pay = {
                    cookies: cookies || this._cookie.join(';') || '',
                    url: paymentCheckUrl
                };
                //block browser goto 3ds page
                return false;
            }
            if (/shaw\.sg/.test(url)) {
                return whiteList && !blackList;
            } else {
                return true;
            }
        } else {
            return whiteList && !blackList;
        }
    },
    responseFilter: async function (response, content) {
        let url = response.url();
        if (/api\/SeatingStatuses/.test(url)) {
            let seatsInfo = extractSeats(url, content);
            if (typeof seatsInfo !== 'undefined') {
                NestiaWeb.logger.info('SEATS:', JSON.stringify(seatsInfo));
                this._seats = seatsInfo;
            }
        }
        if (/\/(StartTimer)/.test(url)) {
            //let content='2019|5|20|20|44|39';
            content = ('' + content).trim();
            let match = content.match(/^(\d{4})\|(\d{1,2})\|(\d{1,2})\|(\d{1,2})\|(\d{1,2})\|(\d{1,2})$/);
            if (match) {
                let expireTime = new Date(match[1] * 1, match[2] * 1, match[3] * 1, match[4] * 1, match[5] * 1, match[6] * 1);
                this._movieInfo.expireTime = expireTime;
            }
        }
        if (/\/(DoPaymentInline)/.test(url)) {
            //Due to puppteer bug following code doesn't work
            //https://github.com/GoogleChrome/puppeteer/issues/2233
            // https://github.com/GoogleChrome/puppeteer/issues/1062
            let req = response.request();
            let headers = response.headers();
            let reqHeaders = req.headers();
            let paymentCheckUrl = headers['location'];
            let cookies = reqHeaders['cookie'];
            if (!/^http/.test(paymentCheckUrl)) {
                paymentCheckUrl = 'https://www.shaw.sg' + paymentCheckUrl;
            }
            this._pay = {
                cookies: cookies,
                url: paymentCheckUrl
            }
        }

        let responseHeaders = response.headers();
        this._cookie = this._cookie || [];
        if (responseHeaders['set-cookie']) {
            let setStr = responseHeaders['set-cookie'];
            this._cookie.push(setStr.replace(/;.*$/, ''));
        }

    },
    getMovieInfo: async function () {
        return this._movieInfo || {};
    },
    getTicketLimit: function () {
        return 6;
    },
    getSeats: async function () {
        return this._seats || {};
    },
    selectSeats: async function (seats) {
        if (this._movieInfo && !this._movieInfo.available) {
            throw new Error('This movie is unavailable for booking now.');
        }
        if (!seats || seats.length === 0) {
            throw new Error('Please select at least on seat.');
        }
        if (this._seatSelected) {
            throw new Error('Seat already selected!');
        }
        let page = this.page;
        for (let seat of seats) {
            let position;
            do {
                position = await utils.getElementPosition(page, '#DiagramTest_canvas_svg #' + seat);
                if (position && (position.top + position.height > page.__context.viewport.height
                    || position.left + position.width > page.__context.viewport.width
                    || position.top < 0
                    || position.left < 0)) {
                    await page.evaluate((left, top) => {
                        window.scrollTo(window.scrollX + left, window.scrollY + top);
                    }, position.left, position.top);
                } else {
                    break;
                }
            } while (true);
            if (position) {
                NestiaWeb.logger.debug('clicking seat:', seat);
                await page.mouse.click(position.left + 2, position.top + 2);
            }
            await utils.sleep(200);
        }

        let config;
        try {
            config = await NestiaWeb.config.getConfig(
                'movie_agent.json',
                'json',
            );
            config = JSON.parse(config.content);
            config = config['shaws'];
        } catch (e) {
            NestiaWeb.logger.error('Error getting movie agent config:', e.message, e);
            throw e;
        }

        //Collect Bills
        let bill = {
            items: [],
            total: 0
        };
        let seatPrice = await page.evaluate(function () {
            return {
                name: jQuery.trim(jQuery('#seats').text()),
                quantity: jQuery.trim(jQuery('#quantity').text()) * 1,
                price: jQuery.trim(jQuery('#total').text().replace(/[^\d\.]/g, '')) * 1,
            };
        });
        if (!seatPrice.price) {
            throw new Error('Invalid seat');
        }
        bill.items.push(seatPrice);
        let convenienceFee = config['booking_fee_per_order'] * 1 + config['booking_fee_per_ticket'] * seats.length;
        let cinemaFee = seatPrice.price + convenienceFee;

        let extraFee = {
            name: 'Convenience Fee',
            quantity: 1,
            price: convenienceFee + config['transaction_fee_static'] * 1 + config['transaction_fee_percent'] * cinemaFee,
        };
        bill.items.push(extraFee);
        let total = 0;
        for (let item of bill.items) {
            total += item.price;
        }
        bill.total = total;
        //click AddToCart
        do {
            let visible = await page.evaluate(function () {
                return jQuery('#AddToCart').is(':visible');
            });
            if (visible) {
                break;
            }
        } while (true);
        //#AddToCart
        let position;
        do {
            position = await utils.getElementPosition(page, '#AddToCart');
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
            NestiaWeb.logger.debug('clicking confirm promotion');
            await page.mouse.click(position.left + 2, position.top + 2);
        }

        do {
            let visible = await page.evaluate(function () {
                return jQuery('#AddToOnePagePromotions').is(':visible');
            });
            if (visible) {
                break;
            }
        } while (true);
        do {
            position = await utils.getElementPosition(page, '#AddToOnePagePromotions');
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
            NestiaWeb.logger.debug('clicking confirm addon');
            await page.mouse.click(position.left + 2, position.top + 2);
            do {
                let visible = await page.evaluate(function () {
                    return jQuery('#AddToOnePagePromotions').is(':visible');
                });
                if (!visible) {
                    break;
                }
                await utils.sleep(300);
                NestiaWeb.logger.debug('clicking confirm addon');
                await page.mouse.click(position.left + 2, position.top + 2);
            } while (true);
        }
        do {
            position = await utils.getElementPosition(page, '#AddToOnePageAddon');
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
            NestiaWeb.logger.debug('clicking confirm');
            await page.mouse.click(position.left + 2, position.top + 2);
        }
        NestiaWeb.logger.info('Seat Selected,bill info:', JSON.stringify(bill));
        this._seatSelected = true;
        this._bill = bill;
        return bill;
    },
    executePayment: async function (paymentParams) {
        if (!this._seatSelected) {
            throw new Error('Please select seats first!');
        }

        let payment = await utils.getPaymentParams(paymentParams);
        NestiaWeb.logger.info('Paying bill[' + this._bill.total + '] via ' + payment.name + '[' + payment.card_no + ']');
        await utils.fillForm(this.page, '#payee-name', payment.name);
        await utils.fillForm(this.page, '#payee-email', payment.email);
        await utils.fillForm(this.page, '#payee-contact', payment.phone);
        await utils.fillForm(this.page, '#credit-card-number', payment.card_no);
        await utils.fillForm(this.page, '#credit-card-name', payment.card_holder);
        await utils.fillForm(this.page, '#credit-card-expiry', payment.card_expiry);
        await utils.fillForm(this.page, '#credit-card-cvv', payment.security_code);
        // .payment-submit click
        this._paying = true;

        let position, page = this.page;
        do {
            position = await utils.getElementPosition(page, '.payment-submit');
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
            NestiaWeb.logger.debug('clicking PAY');
            await page.mouse.click(position.left + 2, position.top + 2);
        }
        /*let text;
        do {
            try {
                await page.waitForSelector('.heading');
                text = await page.evaluate(function () {
                    var heading = document.querySelectorAll('.heading');
                    if (heading.length) {
                        return heading[0].innerText;
                    } else {
                        return '';
                    }
                });
            } catch (e) {
                if (/Context/.test(e.message)) {
                    await utils.sleep(1000);
                } else {
                    throw e;
                }
            }
            if (!/Please wait!/.test(text)) {
                break;
            } else {
                await utils.sleep(1000);
            }
        } while (true);
        //http://www.shaw.sg/ProcessResultsUnsuccessful
        if (/Payment Unsuccessful/.test(text)) {
            return {
                result: false,
                message: text
            };
        } else {
            return {message: '' + text};
        }*/

        while (!this._pay) {
            await utils.sleep(500);
        }
        return this._pay;
    },
};


module.exports = {
    cinema: 'shaws',
    impl: impl
};