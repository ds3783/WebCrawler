const fs = require('fs');
const path = require('path');

const alias = {

  'TOUTIAO_NEWS_DETAIL': 'toutiao.newsDetail',
  'JD_ITEM_PRICE': 'jd.itemPrice',
  'DEBANK_WALLET': 'debank.walletDetail',
  'COMMON_HTML': 'common.html',
  'COMMON_JSON': 'common.json',
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