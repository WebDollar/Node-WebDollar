const EventEmitter = require('events');

class PoolStatistics{

    constructor(poolManagement){

        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(100);

        this.poolManagement = poolManagement;

        this.POOL_STATISTICS_TIME = 5000;

        this.poolHashes = 0;
        this.poolHashesNow = 0;

        this.poolMinersOnline = 0;
        this.poolMinersOnlineNow = {
            length: 0
        };



    }

    startInterval(){
        this._interval = setInterval( this._poolStatisticsInterval.bind(this), this.POOL_STATISTICS_TIME );
    }

    clearInterval(){
        clearInterval(this._interval);
    }

    _poolStatisticsInterval(){

        this.poolHashes = Math.floor( this.poolHashesNow / (this.POOL_STATISTICS_TIME/1000));
        this.poolHashesNow = 0;

        this.poolMinersOnline = this.poolMinersOnlineNow;
        this.poolMinersOnlineNow = {
            length: 0,
        };

        this.emitter.emit("pools/statistics/update", { poolHashes: this.poolHashes, poolMinersOnline: this.poolMinersOnline });

    }


    addStatistics(hashes, minerPoolPublicKey, minerInstance){

        this.poolManagement.poolStatistics.poolHashesNow += hashes;

        let address = minerPoolPublicKey.toString("hex");
        if (this.poolMinersOnlineNow[address.toString("hex")] === undefined) {
            this.poolMinersOnlineNow[address] = minerInstance;
            this.poolMinersOnlineNow.length ++;
        }

    }

}

export default PoolStatistics;