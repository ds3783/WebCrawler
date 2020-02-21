const cron = require('node-cron');
const NestiaWeb = require('nestia-web');

const MovieCathyTheater = require('./jobs/movieCathyTheater');

const CathyCronTimes = [
    '15 2 */3 * * *',
    '1 7 */3 * * *',
    '25 12 */3 * * *',
    '5 16 */3 * * *',
];

const roll = function (arr) {
    let len = arr.length;
    let roll = Math.floor(Math.random() * len);
    return arr[roll];
};

module.exports = {
    init: function () {
        MovieCathyTheater.init();
        let cathyCronTime = roll(CathyCronTimes);
        NestiaWeb.logger.info('Cathy Job scheduled at: ' + cathyCronTime);
        cron.schedule(cathyCronTime, () => {
            NestiaWeb.logger.info('Start Cathy Job');
            MovieCathyTheater.run().then(() => {
                NestiaWeb.logger.info('Cathy Job executed successful');
            }).catch(e => {
                NestiaWeb.logger.info('Start Cathy Job executed failed:' + (e && e.message), e);
            });
        });
        NestiaWeb.logger.info('Cron crawler init finished.');
    }
};