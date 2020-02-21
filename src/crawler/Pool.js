const NestiaWeb = require('nestia-web');

const DefaultOpts = {
    name: '',
    maxPoolSize: 10,
    minPoolSize: 1,
    selfTestInterval: 300 * 1e3,
    validate: function () {
        return new Promise(function (resolve) {
            resolve();
        });
    },
    produce: function () {
        return new Promise(function (resolve, reject) {
            resolve({});
        });
    },
    finalize: function (item) {
    }
};

function Pool(options) {
    this.inited = false;
    this.pool = [];

    this.options = Object.assign({}, DefaultOpts, options || {});

    let _this = this;
    if (this.options.selfTestInterval > 0) {
        this.selftTestInterval = setInterval(function () {
            _this.selfTest().then(function () {
                NestiaWeb.logger.info('Pool[' + _this.options.name + ']  Self test complete');
            }).catch(function (e) {
                NestiaWeb.logger.error('Pool[' + _this.options.name + '] Self test error:' + e.message, e);
            });
        }, Math.floor(this.options.selfTestInterval / 2));
    }

    this.initializePool().then(function () {
        _this.inited = true;
        NestiaWeb.logger.info('Pool[' + _this.options.name + '] initialize complete');
    }).catch(function (e) {
        _this.inited = true;
        NestiaWeb.logger.error('Pool[' + _this.options.name + '] initialize complete' + e.message, e);
    });
}

Pool.prototype.initializePool = async function () {
    while (this.pool.length < this.options.minPoolSize) {
        let poolItem = await this._createInstance();
        poolItem.status = 'READY';
        poolItem.lastValidTime = +new Date();
        this.pool.push(poolItem);
    }
};

Pool.prototype.selfTest = async function () {
    let toRemove = [], now = Date.now();
    for (let idx = 0; idx < this.pool.length; idx++) {
        let poolItem = this.pool[idx];
        if (poolItem.status === 'READY' && poolItem.lastValidTime <= now - this.options.selfTestInterval) {
            try {
                let validateResult = await this._validate(poolItem);
                if (!validateResult) {
                    poolItem.status = 'DEAD';
                    toRemove.unshift(idx);
                }
            } catch (e) {
                NestiaWeb.logger.error('Pool[' + _this.options.name + '] Item[' + poolItem.hash + '] validate error:' + e.message, e);
            }
        }
    }
    for (let idx of toRemove) {
        let item = this.pool.splice(idx, 1);
        this.options.finalize(item.item);
    }
};

Pool.prototype.getItem = async function () {
    if (!this.inited) {
        throw new Error('Pool initialization INCOMPLETE!');
    }
    for (let poolItem of this.pool) {
        if (poolItem.status === 'READY') {
            poolItem.status = 'BUSY';
            NestiaWeb.logger.info('Pool[' + this.options.name + '] Item[' + poolItem.hash + '] borrowed');
            return {hash: poolItem.hash, item: poolItem.item};
        }
    }
    if (this.pool.length < this.options.maxPoolSize) {
        let poolItem = await this._createInstance();
        poolItem.status = 'BUSY';
        poolItem.lastValidTime = +new Date();
        this.pool.push(poolItem);
        NestiaWeb.logger.info('Pool[' + this.options.name + '] Item[' + poolItem.hash + '] borrowed');
        return {hash: poolItem.hash, item: poolItem.item};
    } else {
        NestiaWeb.logger.info('Pool[' + this.options.name + '] max capacity reached:' + this.pool.length + ' capacity:' + this.options.maxPoolSize);
        throw new Error('Pool[' + this.options.name + '] reached max capacity');
    }
};

Pool.prototype.releaseItem = async function (poolItem, drop) {
    let item;
    NestiaWeb.logger.info('Pool[' + this.options.name + '] Item[' + poolItem.hash + '] ' + (drop ? "DROP" : "no drop") + ' releasing ');
    for (let idx = 0; idx < this.pool.length; idx++) {
        if (this.pool[idx].hash === poolItem.hash) {
            item = this.pool.splice(idx, 1)[0];
            break;
        }
    }
    item.status = 'READY';

    if (drop || this.pool.length >= this.options.maxPoolSize) {
        this.options.finalize(item.item);
    } else {
        this.pool.push(item);
    }
    NestiaWeb.logger.info('Pool[' + this.options.name + '] Item[' + poolItem.hash + '] ' + (drop ? "DROP" : "no drop") + ' released ');
};

Pool.prototype._createInstance = async function () {
    let hash = ('' + new Date().getTime()).substr(6) + ('' + Math.random()).substr(2);
    let poolItem = {
        hash,
        status: 'READY',
        lastValidTime: 0,
    };
    let item = await this.options.produce();
    poolItem.item = item;
    NestiaWeb.logger.info('Pool[' + this.options.name + '] Item[' + poolItem.hash + '] created');
    return poolItem;
};

Pool.prototype.destroy = async function () {
    if (typeof this.selftTestInterval === 'number') {
        clearInterval(this.selftTestInterval);
    }
    for (let idx = 0; idx < this.pool.length; idx++) {
        let poolItem = this.pool[idx];
        if (poolItem.status === 'READY' && poolItem.lastValidTime <= now - this.options.selfTestInterval) {
            try {
                this.options.finalize(poolItem.item);
            } catch (e) {
                NestiaWeb.logger.error('Pool[' + this.options.name + '] Item[' + poolItem.hash + '] finalize error:' + e.message, e);
            }
        }
    }
};

Pool.prototype._validate = async function (item) {
    let _this = this;
    NestiaWeb.logger.info('Pool[' + this.options.name + '] Item[' + item.hash + ':' + item.status + '] prepare validate ');
    return new Promise(async (resolve, reject) => {
        if (item.status !== 'READY') {
            reject(new Error('Item[' + item.hash + '] status is not READY: ' + item.status));
            return;
        }
        item.status = 'BUSY';
        NestiaWeb.logger.info('Pool[' + this.options.name + '] Item[' + item.hash + ':' + item.status + '] begin validate ');
        let result = await _this.options.validate(item.item);
        NestiaWeb.logger.info('Pool[' + this.options.name + '] Item[' + item.hash + ':' + item.status + '] validate  complete:' + result);
        if (result) {
            item.status = 'READY';
            resolve(result);
        } else {
            NestiaWeb.logger.info('Pool[' + this.options.name + '] Item[' + item.hash + ':' + item.status + '] Dropping');
            await this.releaseItem(item, true);
            NestiaWeb.logger.info('Pool[' + this.options.name + '] Item[' + item.hash + ':' + item.status + '] Dropped');
        }
    });

};


module.exports = {
    createPool: function (opts) {
        return new Pool(opts);
    }
};