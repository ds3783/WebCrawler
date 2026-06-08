import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const alias = {

  'TOUTIAO_NEWS_DETAIL': 'toutiao.newsDetail',
  'JD_ITEM_PRICE': 'jd.itemPrice',
  'DEBANK_WALLET': 'debank.walletDetail',
  '3MIR_HOME': '3mir.homepage',
  'MACROMICRO_CHART': 'macromicro.chartData',
  'MACROMICRO_JSON': 'macromicro.jsonInPage',
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

{
  "use strict";
  let currentDir = __dirname;

  async function iterate(dir) {
    let files = fs.readdirSync(dir);
    for (let file of files) {
      let fullPath = path.join(dir, file);
      let fileState = fs.lstatSync(fullPath);
      if (fileState.isDirectory()) {
        await iterate(fullPath);
      } else if (/^.*\.js$/.test(file) && file !== 'index.js') {
        let shortName = file.replace(/\.js$/, '');
        let relative = path.relative(currentDir, dir);
        let keys = relative.split(path.sep).filter(Boolean);
        let descObj = descriptions;
        for (let kName of keys) {
          if (!descObj.hasOwnProperty(kName)) {
            descObj[kName] = {};
          }
          descObj = descObj[kName];
        }
        let desc = (await import(pathToFileURL(fullPath).href)).default;
        if (desc && desc.isJobDesc) {
          descObj[shortName] = desc;
        }
      }
    }
  }

  await iterate(currentDir);
}


export default {
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