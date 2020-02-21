const express = require('express');
const router = express.Router();
const NestiaWeb = require('nestia-web');
const path = require('path');
const fs = require('fs');

const uuid = require('uuid/v1');

const MovieAgent = require('../../movieAgent');


router.post('/createSession', function (req, res) {
    "use strict";
    res.send({
        id: uuid()
    });
});

router.post('/startSession', async function (req, res) {
    "use strict";
    try {
        let session = await MovieAgent.openSession(req.query.sessionId, req.body.cinema, req.body.bookingUrl);
        if (!session.id) {
            res.status(401).send({
                id: session.id,
                message: 'Invalid sessionId'
            });
            return;
        }
        let movieInfo = await session.start(req.body);
        res.send({
            id: session.id,
            cinema: session.cinema,
            bookingUrl: session.bookingUrl,
            movieInfo: movieInfo
        });
    } catch (e) {
        NestiaWeb.logger.error(e.message, e);
        res.status(500).send(e.message);
    }
});

router.get('/checkSession', async function (req, res) {
    "use strict";
    let session = await MovieAgent.getSession(req.query.sessionId);
    if (session) {
        res.send(session.state);
    } else {
        res.status(404).send('NOT-EXISTS');
    }
});

router.get('/getMovieInfo', async function (req, res) {
    "use strict";
    let session = await MovieAgent.getSession(req.query.sessionId);
    if (session) {
        let movieInfo = await session.getMovieInfo();
        res.send(movieInfo);
    } else {
        res.status(404).send('NOT-EXISTS');
    }
});

router.get('/getSeatsMap', async function (req, res) {
    "use strict";
    let session = await MovieAgent.getSession(req.query.sessionId);
    if (session) {
        let seats = await session.getSeats();
        res.send(seats);
    } else {
        res.status(404).send('NOT-EXISTS');
    }
});

router.post('/selectSeats', async function (req, res, next) {
    "use strict";
    let session = await MovieAgent.getSession(req.query.sessionId);
    if (!Array.isArray(req.body.seats)) {
        req.body.seats = [
            req.body.seats
        ];
    }
    if (session) {
        try {
            let result = await session.selectSeats(req.body.seats);
            res.send(result);
        } catch (e) {
            next(e);
        }
    } else {
        res.status(404).send('NOT-EXISTS');
    }
});

router.post('/executePayment', async function (req, res, next) {
    "use strict";
    //TODO:  这个各种打日志
    //TODO:: validate req.body.paymentOrder
    let session = await MovieAgent.getSession(req.query.sessionId);
    if (session) {
        try {
            let result = await session.executePayment();
            res.send(result);
        } catch (e) {
            next(e);
        }
    } else {
        res.status(404).send('NOT-EXISTS');
    }

});

router.post('/closeSession', async function (req, res, next) {
    "use strict";
    try {
        await MovieAgent.closeSession(req.query.sessionId);
        res.send({'result': true});
    } catch (e) {
        next(e);
    }

});

module.exports = router;

