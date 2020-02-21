const NestiaWeb = require('nestia-web');
const utils = require('../utils');

/*
EL_HDS 残疾人
EL_STS  普通座
EL_SCR  屏幕
EL_LBL  Label
EL_EXT  Exit
EL_TOL_M  厕所标识符
EL_ENT  Entrance
EL_WALL  ？todo
*/
// $('.table-confirm:contains("temporary unavailable")').length  not available

/*'NONE|EMPTY|SELECTED|SOLD|UNAVAILABLE'*/

const SEAT_TYPE_MAPPING = {
    'L': 'EMPTY',
    '?': 'UNAVAILABLE',
    'B': 'SOLD',
};


const extractMovieInfo = async function (page, url) {
    return await page.evaluate(function () {
        var jQuery = window.jQuery;

        var overview = jQuery('.session-overview');
        var time = overview.find('.session-time').text();
        time = time.replace(/Showing on /, '').replace(/(\d)([AP]M)/, '$1 $2');
        time = new Date(time).getTime();
        var cinema = overview.find('.cinema-screen-name').text();
        var hall = cinema.replace(/^(.*) \- (.*)$/, '$2');
        cinema = cinema.replace(/^(.*) \- (.*)$/, '$1');
        return {
            title: overview.find('.movie-title').text(),
            cover: overview.find('.movie-poster').attr('src'),
            time: time,
            available: jQuery('#ticket-voucher').length > 0,
            cinema: cinema,
            hall: hall,
        };
    });
};

const extractSeats = function (url, content) {

    let jsonContent;
    try {
        jsonContent = JSON.parse(content);
    } catch (e) {
        NestiaWeb.logger.error('Error parse gv seats json:', e);
        return;
    }

    let seatsData = jsonContent.data;
    let cols = 0;
    let rows = seatsData.length;
    for (let row of seatsData) {
        cols = Math.max(row.length, cols);
    }
    let result = {
        "rows": rows,
        "columns": cols,
        "seats": []
    };

    for (let x = 0; x < seatsData.length; x++) {
        let row = seatsData[x];
        for (let y = 0; y < row.length; y++) {
            let item = row[y];
            let seatType;
            if (!item.type) {
                seatType = 'NONE';
            } else {
                seatType = item.type === 'N' ? SEAT_TYPE_MAPPING[item.status] : 'UNAVAILABLE';
            }
            result.seats.push({
                row: x,
                col: y,
                type: seatType,
                rowName: item.rowId,
                colName: item.columnId,
                id: item.id || '__NONE_' + x + '_' + y,
            });
        }
    }
    return result;
};


const impl = {
    start: async function (sessionParam) {
        this._movieInfo = {};
        this._url = sessionParam.bookingUrl;
        await this.page.goto(sessionParam.bookingUrl, {
            waitUntil: 'domcontentloaded'
        });
        let page = this.page;
        this.page.on('framenavigated', function () {
            page.evaluate(function () {
                setTimeout(function () {
                    setInterval(function () {
                        window.onbeforeunload = null;
                    }, 500);
                    window.alert = function () {
                    };
                }, 10);
            });
        });
        await this.page.evaluate(function () {
            setTimeout(function () {
                setInterval(function () {
                    window.onbeforeunload = null;
                }, 500);
                window.alert = function () {
                };
            }, 10);
        });
        await page.waitFor(() => {
            return window.jQuery;
        });

        this._movieInfo = await extractMovieInfo(this.page, this._url);
        return this._movieInfo;
    },
    requestFilter: function (request) {
        let url = request.url();
        let blackList = false, whiteList = false;
        if (/http(s)?:\/\/([^\/]+)?((cathaycineplexes\.com\.sg)|(googleapis\.com)|(googletagmanager\.com)|(cloudflare\.com))\/.*$/.test(url)) {
            whiteList = true;
        }
        if (/http(s)?:\/\/([^\/]+)?((securecode\.com)|(visa.com))\/.*$/.test(url)) {
            whiteList = true;
        }

        if (/(\.gif|\.jpg|\.png|\.woff2)(\?.*)?$/.test(url)) {
            blackList = true;
        }
        if (/fbevents|anaylitcs/.test(url)) {
            blackList = false;
        }
        if (/\/silent\/token\/create/.test(url)) {
            //Due to puppteer bug following code doesn't work
            //https://github.com/GoogleChrome/puppeteer/issues/2233
            // https://github.com/GoogleChrome/puppeteer/issues/1062
            let req = request;
            let reqHeaders = req.headers();
            let cookies = reqHeaders['cookie'] || '';

            this._pay = {
                cookies: cookies,
                url: url,
                method: 'POST',
                payload: req.postData() || '',
                referer: reqHeaders['referer'] || ''
            };
            return false;
        }
        return whiteList && !blackList;
        /*if (this._paying) {
            if (/gv\.com\.sg/.test(url)) {
                return whiteList && !blackList;
            } else {
                return true;
            }
        } else {
            return whiteList && !blackList;
        }*/
    },
    responseFilter: async function (response, content) {
        let url = response.url();
        NestiaWeb.logger.info('RESPONSE URL:', url);
        /*if (/\/Ticketing\/visSelectTickets.aspx/.test(url)) {
            /!*let seatsInfo = extractSeats(url, content);
            if (typeof seatsInfo !== 'undefined') {
                NestiaWeb.logger.info('SEATS:', JSON.stringify(seatsInfo));
                this._seats = seatsInfo;
            }*!/
        }
        if (/\/Ticketing\/visSelectTickets.aspx/.test(url)) {
            this._filmInfo = JSON.parse(content);
            if (this._filmInfo && this._sessions) {
                this._movieInfo = await extractMovieInfo(this._filmInfo, this._sessions, this._url);
            }
        }
        if (/\/.gv-api\/sessionforfilm/.test(url)) {
            this._sessions = JSON.parse(content);
            if (this._filmInfo && this._sessions) {
                this._movieInfo = await extractMovieInfo(this._filmInfo, this._sessions, this._url);
            }
        }
        if (/\/.gv-api\/getpaymentmodes/.test(url)) {

        }
        if (/\/(StartTimer)/.test(url)) {
            //let content='2019|5|20|20|44|39';
            content = ('' + content).trim();
            let match = content.match(/^(\d{4})\|(\d{1,2})\|(\d{1,2})\|(\d{1,2})\|(\d{1,2})\|(\d{1,2})$/);
            if (match) {
                let expireTime = new Date(match[1] * 1, match[2] * 1, match[3] * 1, match[4] * 1, match[5] * 1, match[6] * 1);
                this._movieInfo.expireTime = expireTime;
            }
        }*/


        let responseHeaders = response.headers();
        this._cookie = this._cookie || [];
        if (responseHeaders['set-cookie']) {
            let setStr = responseHeaders['set-cookie'];
            this._cookie.push(setStr.replace(/;.*$/, ''));
        }

    },
    getMovieInfo: async function () {
        return this._movieInfo;
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

            NestiaWeb.logger.debug('clicking seat:', seat);
            await page.evaluate(function (seatId) {
                jQuery('.seatstatuscontainer[tooltip="' + seatId + '"]').click()
            }, seat);
            await utils.sleep(200);
        }
        //select ticket type
        //$('select.form-control[ng-model="selTixType"]').trigger('change')
        NestiaWeb.logger.debug('selecting ticket type');
        await page.evaluate(function () {
            var selectElem = $('select.form-control[ng-model="selTixType"]');
            var options = selectElem.find('option');
            var idx = -1;
            options.each(function (i, elem) {
                var option = $(elem);
                if (/Standard/.test(option.text())) {
                    idx = i;
                    return false;
                }
            });
            selectElem[0].selectedIndex = idx;
            selectElem.trigger('change');
            //click visa

        });


        let config;
        try {
            config = await NestiaWeb.config.getConfig(
                'movie_agent.json',
                'json',
            );
            config = JSON.parse(config.content);
            config = config['gv'];
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
            var itemName = $('.item-name');
            var row = itemName.closest('.row');

            return {
                name: itemName.text(),
                quantity: row.children(':eq(2)').find('p').text() * 1,
                price: row.children(':eq(3)').find('p').text().replace(/[^\d\.]/g, '') * 1,
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


        do {
            await utils.sleep(100);
            let visible = await page.evaluate(function () {
                return $('#1').is(':visible');
            });
            if (visible) {
                break;
            }
        } while (true);
        await page.evaluate(function () {
            $('#1').click();
        });

        do {
            await utils.sleep(100);
            let visible = await page.evaluate(function () {
                return $('button.btn-primary[ng-disabled="submittedPGForm"]').is(':visible');
            });
            if (visible) {
                break;
            }
        } while (true);
        await page.evaluate(function () {
            $('button.btn-primary[ng-disabled="submittedPGForm"]').click();
        });

        do {
            await utils.sleep(100);
            let visible = await page.evaluate(function () {
                return $('button.btn-primary[ng-click="ok()"]').is(':visible');
            });
            if (visible) {
                break;
            }
        } while (true);
        await page.evaluate(function () {
            $('button.btn-primary[ng-click="ok()"]').click();
        });


        NestiaWeb.logger.info('Seat Selected,bill info:', JSON.stringify(bill));
        this._seatSelected = true;
        this._bill = bill;
        return bill;
    },
    executePayment: async function (paymentParams) {
        if (!this._seatSelected) {
            throw new Error('Please select seats first!');
        }
        let page = this.page;
        let payment = await utils.getPaymentParams(paymentParams);
        NestiaWeb.logger.info('Paying bill[' + this._bill.total + '] via ' + payment.name + '[' + payment.card_no + ']');
        await utils.fillForm(this.page, '#uNameFld', payment.name);
        await utils.fillForm(this.page, '#uEmailFld', payment.email);
        await utils.fillForm(this.page, '#uTelFld', payment.phone);
        await page.evaluate(function () {
            $('button:contains("Next"):visible').click();
        });
        do {
            await utils.sleep(100);
            let visible = await page.evaluate(function () {
                return $('input[placeholder="(16 digits only, with no spacing)"]').is(':visible');
            });
            if (visible) {
                break;
            }
        } while (true);
        await utils.fillForm(this.page, 'input[placeholder="(16 digits only, with no spacing)"]', payment.card_no);
        await utils.fillForm(this.page, 'input[placeholder="MMYYYY"]', payment.card_holder);
        let card_expiry = payment.card_expiry;
        if (/\d{4}/.test(card_expiry)) {
            card_expiry = card_expiry.replace(/^(\d\d)(\d\d)$/, '$120$2')
        }
        await utils.fillForm(this.page, 'input[placeholder="MMYYYY"]', card_expiry);
        await utils.fillForm(this.page, 'input[placeholder="CVV2/CVC2"]', payment.security_code);
        // .payment-submit click
        this._paying = true;

        do {
            await utils.sleep(100);
            let visible = await page.evaluate(function () {
                return $('button:contains("Proceed to Summary")').is(':visible');
            });
            if (visible) {
                break;
            }
        } while (true);
        await page.evaluate(function () {
            $('button:contains("Proceed to Summary")').click();
        });
        while (true) {
            await utils.sleep(100);
            let hasPayBtn = await page.evaluate(function () {
                return $('button:contains("Pay"):visible').length > 0;
            });
            if (hasPayBtn) {
                break;
            }
        }
        await page.evaluate(function () {
            $('button:contains("Pay"):visible').click()
        });


        while (!this._pay) {
            await utils.sleep(500);
        }
        return this._pay;
    },
};


module.exports = {
    cinema: 'cathy',
    impl: impl
};