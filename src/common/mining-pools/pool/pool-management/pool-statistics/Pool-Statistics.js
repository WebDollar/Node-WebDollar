const EventEmitter = require('events');
import consts from 'consts/const_global'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';

class PoolStatistics{

    constructor(poolManagement, databaseName){

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
        this.poolTimeRemaining = 0;


        this.poolBlocksConfirmedAndPaid = 0;
        this._db = new InterfaceSatoshminDB( databaseName ? databaseName : consts.DATABASE_NAMES.SERVER_POOL_DATABASE );


    }

     initializePoolStatistics(){

        return  this._load();

    }

    startInterval(){
        this._interval = setInterval( this._poolStatisticsInterval.bind(this), this.POOL_STATISTICS_TIME );
        this._saveInterval = setInterval( this._save.bind(this), 5*this.POOL_STATISTICS_TIME);
    }

    clearInterval(){
        clearInterval(this._interval);
        clearInterval(this._saveInterval);
    }

    _poolStatisticsInterval(){

        this.poolHashes = Math.floor( this.poolHashesNow / (this.POOL_STATISTICS_TIME/1000));
        this.poolHashesNow = 0;

        this.poolMinersOnline = this.poolMinersOnlineNow;
        this.poolMinersOnlineNow = {
            length: 0,
        };

        this.emitter.emit("pools/statistics/update", { poolHashes: this.poolHashes, poolMinersOnline: this.poolMinersOnline, poolBlocksConfirmed: this.poolBlocksConfirmed,  poolBlocksUnconfirmed: this.poolBlocksUnconfirmed, poolTimeRemaining: this.poolTimeRemaining, });

    }


    addStatistics(hashes, minerInstance){

        this.poolManagement.poolStatistics.poolHashesNow += hashes.toNumber();


        if (this.poolMinersOnlineNow[minerInstance.publicKeyString] === undefined) {
            this.poolMinersOnlineNow[minerInstance.publicKeyString] = minerInstance;
            this.poolMinersOnlineNow.length ++;
        }

    }

    addBlocksStatistics(blocksConfirmed, blocksUnconfirmed, blocksConfirmedAndPaid ){

        this.poolBlocksUnconfirmed = blocksUnconfirmed;
        this.poolBlocksConfirmed = blocksConfirmed;

        this.poolBlocksConfirmedAndPaid += blocksConfirmedAndPaid;

    }



    async _save(){

        await this._db.save("serverPool_statistics_confirmedAndPaid", this.poolBlocksConfirmedAndPaid )

    }

    async _load(){

         let confirmedAndPaid = await this._db.get("serverPool_statistics_confirmedAndPaid", 30*1000, true);

         if (typeof confirmedAndPaid === "number")
             this.poolBlocksConfirmedAndPaid = confirmedAndPaid;

         return true;
    }

}

export default PoolStatistics;