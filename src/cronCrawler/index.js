const cron = require('node-cron');
const NestiaWeb = require('nestia-web');


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
        
    }
};