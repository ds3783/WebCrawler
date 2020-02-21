const express = require('express');
const router = express.Router();
const NestiaWeb = require('nestia-web');
const path = require('path');
const fs = require('fs');
const agent = require('./agent');

router.use('/agent', agent);


router.get('/cathy', function (req, res) {
    "use strict";
    let cronCrawlerDataPath = NestiaWeb.manifest.get('cronJobDataPath');
    let file = path.resolve(path.join(cronCrawlerDataPath, 'movie_cathy.json'));

    if (fs.existsSync(file)) {
        let stat = fs.statSync(file);
        res.writeHead(200, {
            'Content-Type': 'application/json;charset=utf8;',
            'Content-Length': stat.size
        });
        let readStream = fs.createReadStream(file, {
            flags: 'r',
            encoding: 'utf8',
            autoClose: true,
        });
        readStream.pipe(res);
    } else {
        res.setHeader('Content-Type', 'application/json;charset=utf8;');
        res.status(404);
        res.end('["Cathy data not exists!"]');
    }

});

module.exports = router;

