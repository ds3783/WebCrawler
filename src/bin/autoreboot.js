const path = require('path');
const fs = require('fs');
const pm2 = require('pm2');
const cron = require('node-cron');


const RestartTimes = {
    'Prod1': '15 15 8,14,22 * * *',
    'Prod2': '15 30 8,14,22 * * *',
};

const sleep = function (time) {
    return new Promise((resolve => {
        setTimeout(function () {
            resolve();
        }, time * 1000);
    }));
};

const pm2connect = function () {
    return new Promise((resolve => {
        pm2.connect(function (err) {
            if (err) {
                console.error(err);
                process.exit(2);
            }
            resolve();
        });
    }));
};
const pm2list = function () {
    return new Promise((resolve => {
        pm2.list(function (err, list) {
            if (err) {
                console.error(err);
                process.exit(2);
            }
            resolve(list);
        });
    }));
};

const pm2stop = function (proc) {
    return new Promise((resolve => {
        pm2.stop(proc.name, function (err, apps) {
            resolve(apps);
        });
    }));
};

const pm2start = function (proc) {
    return new Promise((resolve => {
        pm2.start(proc.name, function (err, apps) {
            resolve(apps);
        });
    }));
};

let reboot = async function () {

    console.log('Begin Rebooting');
    let rootDir = path.resolve(path.join(__dirname, '..', '..'));
    let healthCheckFile = path.join(rootDir, 'healthcheck.html');
    //remove health check file

    if (fs.existsSync(healthCheckFile)) {
        console.log('Removing healtheck');
        fs.unlinkSync(healthCheckFile);
    }
    console.log('Waiting for unfinished job');
    //sleep 120s
    await sleep(120);
    //call pm2 reboot
    console.log('Reboot');
    await pm2connect();
    let processList = await pm2list();
    let proc = null;
    for (let p of processList) {
        if (p.name === 'Prod') {
            proc = p;
        }
    }
    if (!proc) {
        console.log('Target instance not found!');
        process.exit(0);
    }
    await pm2stop(proc);
    await sleep(3);
    await pm2start(proc);
    console.log('Wait for start');
    //sleep 30s wait for boot
    await sleep(30);
    //attach health check file
    console.log('Restore healthcheck file');
    fs.writeFileSync(healthCheckFile, ' ');

};

console.log('Instance name:' + process.env['INSTANCE']);
let cronStr = RestartTimes[process.env['INSTANCE']];
console.log('Restart schedule:' + cronStr);
if (cronStr) {
    cron.schedule(cronStr, () => {
        reboot();
    });
} else {
    console.error('ERROR: invalid instance!');
}

// reboot();   4 test