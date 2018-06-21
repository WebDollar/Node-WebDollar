const EventEmitter = require('events');

class PoolStatistics{

    constructor(poolManagement){

        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(100);

        this.poolManagement = poolManagement;

        this.POOL_STATISTICS_TIME = 5000;

        this.poolHashes = 0;
        this.poolHashesNow = 0;

        this.poolMinersOnline ={
            length: 0,
        };
        this.poolMinersOnlineNow = {
            length: 0
        };



        this.poolBlocksUnconfirmed = 0;
        this.poolBlocksConfirmed = 0;



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

        this.emitter.emit("pools/statistics/update", { poolHashes: this.poolHashes, poolMinersOnline: this.poolMinersOnline, poolBlocksConfirmed: this.poolBlocksConfirmed,  poolBlocksUnconfirmed: this.poolBlocksUnconfirmed });

    }


    addStatistics(hashes, minerInstance){

        this.poolManagement.poolStatistics.poolHashesNow += hashes.toNumber();


        if (this.poolMinersOnlineNow[minerInstance.publicKeyString] === undefined) {
            this.poolMinersOnlineNow[minerInstance.publicKeyString] = minerInstance;
            this.poolMinersOnlineNow.length ++;
        }

    }

    addBlocksStatistics(blocksUnconfirmed, blocksConfirmed, ){

        this.poolBlocksUnconfirmed = blocksUnconfirmed;
        this.poolBlocksConfirmed = blocksConfirmed;

    }

}

export default PoolStatistics;