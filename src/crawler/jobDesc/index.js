const fs = require('fs');
const path = require('path');

const alias = {
    'BAIDU_TEST': 'baidu.www',
    'ASIATIMES_LIST': 'asiatimes.newsList',
    'SCMP_DETAIL': 'scmp.newsDetail',
    'CHANNELNEWSASIA_DETAIL': 'channelnewsasia.newsDetail',
    'TOUTIAO_HAIWAI_LIST': 'toutiao.newsList',
    'TOUTIAO_CHANNEL_LIST': 'toutiao.channelList',
    'TOUTIAO_NEWS_DETAIL': 'toutiao.newsDetail',
    'YIDIANZIXUN_CHANNEL_LIST': 'yidianzixun.channelList',
    'KWONGWAH_LIST': 'kwongwah.newsList',
    'KWONGWAH_DETAIL': 'kwongwah.newsDetail',
    'YAHOO_NEWS_LIST': 'yahoo.newsList',
    'BLOOMBERG_ASIA_LIST': 'bloomberg.asia',
    'BLOOMBERG_DETAIL': 'bloomberg.detail',
    'MS_NEWS_LIST': 'mothership.newsList',
    'MS_NEWS_DETAIL': 'mothership.newsDetail',
    'NST_NEWS_LIST': 'nst.newsNation',
    'NST_NEWS_DETAIL': 'nst.newsDetail',
    'PG_AGENT_LIST': 'pg.agentList',
    'PG_AGENT_DETAIL': 'pg.agentDetail',
    'PG_PROPERTY_DETAIL': 'pg.propertyDetail',
    'PG_CONDO_LIST': 'pg.condoList',
    'PG_COMMERCIAL_PROJECT_LIST': 'pg.commercialProjectList',
    'PG_COMMERCIAL_AGENT_DETAIL': 'pg.commercialAgentDetail',
    'PG_COMMERCIAL_PROPERTY_DETAIL': 'pg.commercialPropertyDetail',
    'ULIFESTYLE_NEWS_LIST': 'ulifestyle.newsList',
    'WEIXIN_NEWS_LIST': 'wechat.newsList',
    'WEIXIN_NEWS_LIST2': 'wechat.newsList2',
    'NYTIMES_LATEST_LIST': 'nytimes.latestList',
    'NYTIMES_LATEST_FRAME_LIST': 'nytimes.latestListWithFrame',
    'SAVEFROM_YOUTUBE': 'savefrom.youtube',
    'SHICHENGNEWS_LIST': 'shichengnews.newsList',
    'SHICHENGNEWS_DETAIL': 'shichengnews.newsDetail',
    'SHICHENGNEWS_IMAGE': 'shichengnews.image',
    'YOUTUBE_VIDEO_PAGE': 'youtube.videoPage',
    'MOH_COVID19': 'moh.covid19',
};

let descriptions = {};
/*

const defaultDesc = {
    setPageContext: async function (page) {},
    validateSuccess: async function (page, job) {},
    getResult: async function (page, job) {return '';}
};
*/

(function () {
    "use strict";
    let currentDir = __dirname;

    function iterate(dir) {
        let files = fs.readdirSync(dir);
        for (let file of files) {
            let fullPath = path.join(dir, file);
            let fileState = fs.lstatSync(fullPath);
            if (fileState.isDirectory()) {
                iterate(fullPath);
            } else if (/^.*\.js$/.test(file)) {
                let shortName = file.replace(/\.js$/, '');
                let relative = path.relative(currentDir, dir);
                let keys = relative.split('/');
                let descObj = descriptions;
                for (let kName of keys) {
                    if (!descObj.hasOwnProperty(kName)) {
                        descObj[kName] = {};
                    }
                    descObj = descObj[kName];
                }
                let desc = require(fullPath);
                if (desc.isJobDesc) {
                    descObj[shortName] = desc;
                }
            }
        }
    }

    iterate(currentDir);
})();


module.exports = {
    getDescription: function (type) {
        "use strict";
        let name = type;
        if (alias.hasOwnProperty(type)) {
            name = alias[type];
        }

        let keys = name.split('.');
        let result = descriptions;
        for (let k of keys) {
            if (!result.hasOwnProperty(k)) {
                throw new Error('Invalid type type:' + type + ' key: ' + name);
            }
            result = result[k];
        }
        return Object.assign({}, result);

    }
};