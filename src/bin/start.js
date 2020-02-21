/**
 * Created by ds3783 on 2017/5/29.
 */
"use strict";


const fs = require('fs');
//pm2 should installed globally so not exists in dependency of package.json
const pm2 = require('pm2');

const server = process.argv[2] || '';
const rootDir = __dirname + '/../..';
const configFile = rootDir + '/pm2/process-' + server + '.json';

try {
    fs.accessSync(configFile, fs.constants.R_OK);
    pm2.connect(function (err) {
        if (err) {
            console.error(err);
            process.exit(2);
        }

        pm2.start(configFile, function (err) {
            if (err) {
                pm2.disconnect();   // Disconnects from PM2
                console.error('Failed to start server:' + server);
                console.error(err);
                process.exit(2);
            } else {
                pm2.list(function (err, processDescriptionList) {
                    processDescriptionList && processDescriptionList.forEach(function (item) {
                        console.info('[Server:' + item.name + '] ' + item.pm2_env.status + ' ' + ((new Date() - item.pm2_env.pm_uptime) / 1e3) + 's (instances:' + item.pm2_env.instances + ',mode:' + item.pm2_env.exec_mode + ')');
                    });
                    pm2.disconnect();
                    console.info('[Server:' + server + '] started!');
                });
            }
        });
    });
} catch (e) {
    console.error('[SERVER:' + server + ']Unable to access file ' + configFile + ',file not found or not accessed for current user.');
    console.error(e.message);
    process.exit(3);
}


 
