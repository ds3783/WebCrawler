const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
//var routerConfig = require('./routeConfig');

const FileStreamRotator = require('file-stream-rotator');
const morgan = require('morgan');
const app = express();

const crawler = require('./crawler');
const Browser = require('./browser');
const MovieAgent = require('./movieAgent');

const MiniProxy = require('./browser/miniProxy');

const CronCrawler = require('./cronCrawler');


let initLogParam = function () {

    let logDirectoryParent = path.join(__dirname, '..', 'logs');
    let logDirectory = path.join(__dirname, '..', 'logs', process.env.INSTANCE_ID || '');

    morgan.token('date', function () {
        let date = new Date();
        let fz = function (str, len) {
            str = '' + str;
            while (str.length < len) {
                str = '0' + str;
            }
            return str;
        };
        return date.getFullYear() + '/' + fz(date.getMonth() + 1, 2) + '/' + fz(date.getDate(), 2) + ' ' + fz(date.getHours(), 2) + ':' + fz(date.getMinutes(), 2) + ':' + fz(date.getSeconds(), 2) + '.' + fz(date.getMilliseconds(), 3);
    });

    morgan.token('cookieToken', function (req) {
        let cookies = req.headers['cookie'] || '';
        let result = '-', matches;
        if (matches = cookies.match(/(^|[ ;])token=[^=; $]+/)) {
            if (matches = matches[0].match(/(^|[ ;])token=([^=; $]+)/)) {
                result = matches[2];
            }
        }
        return result;
    });


    try {
        fs.accessSync(logDirectoryParent, fs.constants.W_OK);
    } catch (e) {
        fs.mkdirSync(logDirectoryParent)
    }
    try {
        fs.accessSync(logDirectory, fs.constants.W_OK);
    } catch (e) {
        fs.mkdirSync(logDirectory)
    }


// ensure log directory exists
    fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// create a rotating write stream
    let accessLogStream = FileStreamRotator.getStream({
        date_format: 'YYYYMMDD',
        filename: path.join(logDirectory, 'access-%DATE%.log'),
        frequency: 'daily',
        verbose: false
    });


    const accessFormat = ':remote-addr [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" ":req[x-device-user-agent]" ":req[authorization]" ":cookieToken"';

// create a rotating write stream
    let fiveXXLogStream = FileStreamRotator.getStream({
        date_format: 'YYYYMMDD',
        filename: path.join(logDirectory, '5xx-%DATE%.log'),
        frequency: 'daily',
        verbose: false
    });
    return {
        accessLogStream, fiveXXLogStream, accessFormat, logDirectoryParent, logDirectory
    }
};
let logParam = initLogParam();

let NestiaWeb = require('nestia-web');
NestiaWeb.init({
    EXPRESS_APP: app,
    ENV: process.env.MANIFEST,
    MANIFEST_DIR: path.join(__dirname, 'manifest'),
    LOG_DIR: logParam.logDirectory,
    LOG_LEVEL: process.env.DEV_MODE === 'development' ? 'trace' : 'info',
    LOG_STREAMS: [logParam.accessLogStream, logParam.fiveXXLogStream],
    MONITOR_PREFIX: '',
    MONITOR_SUFFIX: '',
    MONITOR_MEM: true,
    MONITOR_CPU: true,
    MONITOR_404: true,
    MONITOR_5XX: true,
});

// setup the logger
app.use(morgan(logParam.accessFormat, {stream: logParam.accessLogStream}));

// setup the logger
app.use(morgan(logParam.accessFormat, {
    stream: logParam.fiveXXLogStream,
    skip: function (req, res) {
        return res.statusCode < 400
    }
}));

if (!NestiaWeb.logger) {
    NestiaWeb.logger = NestiaWeb.log.getLogger();
}

// view engine setup
app.set('strict routing', false);
app.set('trust proxy', true);
app.set('etag', false);
app.disable('x-powered-by');


app.use(function (req, res, next) {
    res.set('X-Powered-By', NestiaWeb.manifest.get('serverDesc') || 'Nestia Web Server');
    next();
});


app.use('*/healthcheck.html', express.static(path.join(__dirname, '../healthcheck.html'), {
    fallthrough: false
}));

// uncomment after placing your favicon in /public
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({limit: '10mb', extended: false}));


(function () {
    "use strict";
    let routesRoot = path.join(__dirname, 'routes');

    function iteratePath(dir) {
        let files = fs.readdirSync(dir);

        for (let file of files) {
            let fileFullPath = path.join(dir, file);
            let fState = fs.lstatSync(fileFullPath);
            if (fState.isDirectory()) {
                iteratePath(fileFullPath);
            } else if (fState.isFile() && file === 'index.js') {
                let route = require(fileFullPath);
                app.use('/' + path.relative(routesRoot, dir), route);
            }
        }
    }

    iteratePath(routesRoot);
})();


// development error handler
// will print stacktrace           
app.use(function (err, req, res, next) {
    if (err && /^ENOENT:.*healthcheck\.html.*$/.test(err.message)) {
        NestiaWeb.logger.error('/healthcheck.html file missing!');
    } else {
        NestiaWeb.logger.error(err);
    }
    next(err);
});
if (NestiaWeb.manifest.get('type') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.send(err.message);
    });
} else {
    app.use(function (err, req, res, next) {
        res.status(500);
        res.send('<h1>Ooooops!</h1><h2>Internal Server Error happened! Please contact <a href="mailto:tech@nestia.com">Tech Engineers(tech@nestia.com).</ahref></h2>');
    });
}


app.use(function (req, res) {
    //404 Page
    NestiaWeb.logger.error('[!404] "' + [req.method || '-', req.protocol || '-', req.hostname || '-', req.originalUrl || '-', req.ip || '-', req.get('user-agent') || '-', req.get('x-device-user-agent') || '-'].join('" "') + '"');
    res.set('X-Error', 404);
    res.status(404);
    res.send('Not Found').end();
});

//force full gc
(function () {
    let MAX_RSS_MEMORY = 150;
    let IDLE_LIMIT = 15;
    let Monitor = NestiaWeb.monitor;
    let initialSnapShot = false, initialHeapSize = -1, compareSnapShot = false;

    setInterval(function () {
        "use strict";
        let memUsage = process.memoryUsage();
        let rss = memUsage.rss / 1024 / 1024;
        let heapUsed = memUsage.heapUsed / 1024 / 1024;
        let cpu = Monitor.getCpuUsage();
        let cpuAvg = 0;
        cpu.map(function (val) {
            cpuAvg += val * 1;
            return val;
        });
        cpuAvg /= cpu.length;
        NestiaWeb.logger.info(`RSS(${rss}M) HEAP-USED(${heapUsed}M) CPU(${cpuAvg})`);
        if (rss > MAX_RSS_MEMORY && cpuAvg < IDLE_LIMIT) {
            NestiaWeb.logger.warn(`RSS memory too large,force gc. RSS(${Math.round(rss)}M) CPU(${cpuAvg})`);
            if (global.gc) {
                try {
                    global.gc();
                    let memAfterGC = process.memoryUsage();
                    let rssAfterGC = Math.round(memAfterGC.rss / 1024 / 1024);
                    let heapUsedAfterGC = Math.round(memAfterGC.heapUsed / 1024 / 1024);
                    NestiaWeb.logger.info(`after gc ,RSS=${rssAfterGC}M,HEAP-USED=${heapUsedAfterGC}M`);
                } catch (e) {
                    NestiaWeb.logger.error('Error when exec full gc:' + e.message);
                    NestiaWeb.logger.error(e);
                }
            } else {
                NestiaWeb.logger.warn('Garbage collection unavailable.  Pass --expose-gc when launching node to enable forced garbage collection.');
            }
        }

    }, 10000);

})();


MiniProxy.createProxy(NestiaWeb.manifest.get('proxyPort'));

//init Browser
if (Browser && Browser.init) {
    Browser.init().then(() => {
        CronCrawler.init();
    })
}

//init crawler

if (crawler && crawler.init) {
    crawler.init();
    app.locals.crawler = crawler;
}

//init movie agent

if (MovieAgent && MovieAgent.init) {
    MovieAgent.init();
}

module.exports = app;
