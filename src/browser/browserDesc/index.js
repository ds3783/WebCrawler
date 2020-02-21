const descs = require('./descs');
const viewports = require('./viewports');

let probabilityMap = [], maxProbability = 0;

const SCALE = 1e6;

let randomViewport = function () {
    "use strict";
    let idx = Math.floor(Math.random() * viewports.length);
    return {viewport: viewports[idx]};
};

let randomDesc = function () {
    "use strict";
    let seed = Math.round(Math.random() * maxProbability);
    for (let desc of probabilityMap) {
        if (seed > desc.minProb && seed <= desc.maxProb) {
            return desc;
        }
    }
    throw new Error('Error random browser description, seed:' + seed + ', maxProb:' + maxProbability);
};

let initProbabilityMap = function () {
    "use strict";

    for (let desc of descs) {
        let min = maxProbability;
        let delta = Math.floor(desc.probability * SCALE || 0);
        let max = min + delta;
        maxProbability = max;
        desc['minProb'] = min;
        desc['maxProb'] = max;
        probabilityMap.push(desc);
    }
};


initProbabilityMap();


module.exports = {
    getDesc() {
        "use strict";
        return Object.assign({}, randomDesc(), randomViewport());
    }
};