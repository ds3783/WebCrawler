const path = require('path');
const fs = require('fs');

const NestiaWeb = require('nestia-web');
const utils = require('../utils');

let id = 0;
let snapshotPath;


let getWorkDir = function () {
    "use strict";
    let today = new Date();
    let datePath = '' + today.getFullYear() + utils.fillZero(today.getMonth() + 1, 2) + utils.fillZero(today.getDate(), 2);
    let workDir = path.join(snapshotPath, datePath);
    
    if (!fs.existsSync(workDir)) {
        fs.mkdirSync(workDir, {recursive: true});
    }
    return workDir;
};


module.exports = {
    init: function () {
        "use strict";
        snapshotPath = NestiaWeb.manifest.get('screenshotPath');
        let workingDir = getWorkDir();
        let files = fs.readdirSync(workingDir);
        for (let file of files) {
            let match;
            if (match = file.match(/^(\d+)\.json$/)) {
                let fileid = match[1] * 1;
                if (!isNaN(fileid)) {
                    id = Math.max(id, fileid);
                }
            }
        }
    },
    getNewDesc: function () {
        "use strict";
        return {id: utils.fillZero(++id, 4), path: getWorkDir()};
    },
    save: function (desc, job, url, cookies, html, screenShotName) {
        "use strict";
        let today = new Date();
        let data = {
            job: job,
            lastUrl: url,
            cookies: cookies,
            screenshot: screenShotName,
            timestamp: '' + today.getFullYear() + '-' + utils.fillZero(today.getMonth() + 1, 2) + '-' + utils.fillZero(today.getDate(), 2) + ' ' + utils.fillZero(today.getHours(), 2) + ':' + utils.fillZero(today.getMinutes(), 2) + ':' + utils.fillZero(today.getSeconds(), 2) + '.' + utils.fillZero(today.getMilliseconds(), 3)
        };
        fs.writeFileSync(path.join(desc.path, desc.id + '.json'), JSON.stringify(data));
        fs.writeFileSync(path.join(desc.path, desc.id + '.html'), html);

    }
};