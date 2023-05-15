const express = require('express');
const router = express.Router();
const NestiaWeb = require('nestia-web');


router.get('/status', function (req, res) {
    "use strict";
    const crawler = req.app.locals.crawler;
    if (!crawler) {
        res.send({status: 'bad'});
    } else {
        res.send(crawler.status());
    }
});

router.post('/start', function (req, res) {
    "use strict";
    const crawler = req.app.locals.crawler;

    let params = req.body.url ? req.body : req.query;
    let errors = [];
    params.id = crawler.generateId();
    if (!/^http(s)?:\/\/.+$/.test(params.url)) {
        errors.push('Invalid URL:' + params.url);
    }
    if (params.proxy_port && !params.proxy_port > 0) {
        errors.push('Invalid proxy port:' + params.proxy_port);
    }
    if (!params.type) {
        errors.push('Type cannot be null');
    }
    if (errors.length > 0) {
        res.status(400);
        res.send({result: false, message: errors.join('\n')});
        return;
    }

    let context = {
        id: params.id * 1,
        url: params.url,
        proxy_host: params.proxy_host,
        proxy_port: params.proxy_port,
        type: params.type,
        sync: params.sync > 0,
        callback: params.callback,
        params: (params.params && JSON.parse(params.params)) || {},
    };
    if (!crawler) {
        res.send({result: false, message: 'browser not initialized'});
    } else {
        try {
            NestiaWeb.logger.info('Starting job:' + JSON.stringify(context, null, ''));

            if (context.sync) {
                crawler.registerCallback(context.id, function (result) {
                    NestiaWeb.logger.info('Sync job complete, result status is ' + result.result + ' message:' + (result.message || '') + ':' + JSON.stringify(context, null, ''));
                    /*res.setHeader('content-type', 'application/json');
                    res.write(JSON.stringify(result));
                    res.end();*/
                    res.send(JSON.stringify(result, null, 4));
                });
                crawler.start(context).catch(e => {
                    crawler.unregisterCallback(context.id);
                    NestiaWeb.logger.error('Error starting job:' + JSON.stringify(context, null, ''));
                    NestiaWeb.logger.error('Error:' + e.message, e);
                    res.send({result: false, message: e.message});
                });
            } else {
                crawler.registerCallback(context.id, function (result) {
                    NestiaWeb.logger.info('Async job complete, result status is ' + result.result + ' message:' + (result.message || '') + ':' + JSON.stringify(context, null, ''));
                    if (context.callback) {
                        NestiaWeb.logger.info('callback:' + context.callback);
                        NestiaWeb.ajax.request({
                            url: context.callback, method: 'POST', reqContentType: 'json', timeout: 30000, data: result
                        }).catch(e => {
                            NestiaWeb.logger.error('callback failed:' + e.message, e);
                        });
                    }
                });
                crawler.start(context).catch(e => {
                    NestiaWeb.logger.error('Error starting job:' + JSON.stringify(context, null, ''));
                    NestiaWeb.logger.error('Error:' + e.message, e);
                    res.send({result: false, message: e.message});
                });
                res.send({result: true});
            }
        } catch (e) {
            crawler.unregisterCallback(context.id);
            NestiaWeb.logger.error('Error starting job:' + JSON.stringify(context, null, ''));
            NestiaWeb.logger.error('Error:' + e.message, e);
            res.send({result: false, message: e.message});
        }
    }
});


router.post('/seo', function (req, res) {
    "use strict";
    const crawler = req.app.locals.crawler;

    let params = req.body.url ? req.body : req.query;
    let errors = [];
    params.id = crawler.generateId();
    if (!/^http(s)?:\/\/.+$/.test(params.url)) {
        errors.push('Invalid URL:' + params.url);
    }
    if (params.proxy_port && !params.proxy_port > 0) {
        errors.push('Invalid proxy port:' + params.proxy_port);
    }
    if (!params.se_type) {
        errors.push('Search engine type cannot be null');
    }
    if (!params.domain) {
        errors.push('Domain cannot be null');
    }
    if (!params.tags) {
        errors.push('Tags type cannot be null');
    }
    if (errors.length > 0) {
        res.status(400);
        res.send({result: false, message: errors.join('\n')});
        return;
    }

    let context = {
        id: params.id * 1,
        url: params.url,
        domain: params.domain,
        direct_proxy: true,
        proxy_host: params.proxy_host,
        proxy_port: params.proxy_port,
        se_type: params.se_type,
        tags: params.tags,
    };
    if (!crawler) {
        res.send({result: false, message: 'browser not initialized'});
    } else {
        try {
            NestiaWeb.logger.info('Starting seo:' + JSON.stringify(context, null, ''));

            crawler.startSeo(context)
                .then(() => {
                    NestiaWeb.logger.info('Seo job complete:' + JSON.stringify(context, null, ''));
                }).catch(e => {
                crawler.unregisterCallback(context.id);
                NestiaWeb.logger.error('Error starting job:' + JSON.stringify(context, null, ''));
                NestiaWeb.logger.error('Error:' + e.message, e);
            });
            res.send('ok');
        } catch (e) {
            crawler.unregisterCallback(context.id);
            NestiaWeb.logger.error('Error starting job:' + JSON.stringify(context, null, ''));
            NestiaWeb.logger.error('Error:' + e.message, e);
            res.send({result: false, message: e.message});
        }
    }
});

router.post('/static', function (req, res) {
    "use strict";
    const crawler = req.app.locals.crawler;

    let params = req.body || {};
    /*let errors = [];
    // params.id = crawler.generateId();
    if (!/^[\d,]+$/.test(params.id)) {
        errors.push('Invalid params:' + JSON.stringify(params));
    }*/


    let context = {
        params: params
    };
    if (!crawler) {
        res.send({result: false, message: 'browser not initialized'});
    } else {
        try {
            NestiaWeb.logger.info('Starting static job:' + JSON.stringify(context, null, ''));

            let resultPromise = crawler.startStaticJob(params.type, context);
            resultPromise.then(function (data) {
                /*res.setHeader('content-type', 'application/json');
                res.write(JSON.stringify(data));
                res.end();*/
                res.send(data);
            }).catch(function (e) {
                NestiaWeb.logger.error('Error starting static job 1:' + JSON.stringify(context, null, ''));
                NestiaWeb.logger.error('Error:' + e.message, e);
                res.send({result: false, message: e.message});
            });
        } catch (e) {
            NestiaWeb.logger.error('Error starting static job 2:' + JSON.stringify(context, null, ''));
            NestiaWeb.logger.error('Error:' + e.message, e);
            res.send({result: false, message: e.message});
        }
    }
});

module.exports = router;

