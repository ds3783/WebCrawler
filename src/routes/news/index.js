const express = require('express');
const router = express.Router();
const NestiaWeb = require('nestia-web');

const NewsFormatter = require('../../newsFormatter');


router.post('/format', function (req, res, next) {
    "use strict";

    let params = req.body || {
        source: req.body.source,
        format: req.body.format,
        noAdv: req.body.no_adv
    };
    let session = Date.now();
    NestiaWeb.logger.info(`Start formatting news [${session}][id:${params.source.id ? params.source.id : ''}] length:${params.source.content ? params.source.content.length : 0}`);
    NewsFormatter.format(params).then(result => {
        if (result) {
            NestiaWeb.logger.info(`Finish formatting news [${session}] length:${result.content ? result.content.length : 0}`);
            /*res.setHeader('content-type', 'application/json');
            res.write(JSON.stringify(result));
            res.end();*/
            res.send(result);
        }
        res.end();
    }).catch(err => {
        NestiaWeb.logger.error(`Error formatting news [${session}]`, err);
        next(err);
    });

});


module.exports = router;

