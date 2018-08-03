const EventEmitter = require('events');
import consts from 'consts/const_global'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import Log from 'common/utils/logging/Log';

class PoolStatistics{

    constructor(poolManagement, databaseName){

        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(100);

        this.poolManagement = poolManagement;

        this.POOL_STATISTICS_TIME = 120000;
        this.POOL_STATISTICS_MEAN_VALUES = 10;

        this.poolHashes = 0;
        this.poolHashesNow = 0;

        this.poolMinersOnline = this.poolManagement.poolData.connectedMinerInstances.list;

        this.poolBlocksConfirmedAndPaid = 0;
        this.poolBlocksUnconfirmed = 0;
        this.poolBlocksConfirmed = 0;
        this.poolBlocksBeingConfirmed = 0;
        this.poolTimeRemaining = 0;

        this._db = new InterfaceSatoshminDB( databaseName ? databaseName : consts.DATABASE_NAMES.SERVER_POOL_DATABASE );

        //calculate mean
        this._poolHashesLast = [];

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

        let poolHashes = Math.floor( this.poolHashesNow / (this.POOL_STATISTICS_TIME/1000));
        this.poolHashesNow = 0;

        let poolMinersOnline = this.poolMinersOnlineNow;
        this.poolMinersOnlineNow = {
            length: 0
        };

        if (this._poolHashesLast.length === this.POOL_STATISTICS_MEAN_VALUES ){

            for (let i=0; i<this._poolHashesLast.length-1; i++) {
                this._poolHashesLast[i] = this._poolHashesLast[ i + 1 ];
            }

            this._poolHashesLast[this._poolHashesLast.length-1] = poolHashes;

        } else{
            this._poolHashesLast.push(poolHashes);
        }


        let array = [];
        for (let i = 0; i < this._poolHashesLast.length; i++)
            array.push(this._poolHashesLast[i]);

        array.sort(function (a, b) {
            return a - b;
        });

        this.poolHashes = array[Math.floor(array.length / 4)];

        this.emitter.emit("pools/statistics/update", { poolHashes: this.poolHashes,
            poolMinersOnline: this.poolMinersOnline,
            poolBeingConfirmed: this.poolBlocksBeingConfirmed,
            poolBlocksConfirmed: this.poolBlocksConfirmed,
            poolBlocksConfirmedAndPaid: this.poolBlocksConfirmedAndPaid,
            poolBlocksUnconfirmed: this.poolBlocksUnconfirmed,
            poolTimeRemaining: this.poolTimeRemaining,
        });

    }


    addStatistics(hashes){

        this.poolManagement.poolStatistics.poolHashesNow += hashes.toNumber();

    }



    async _save(){

        Log.info('Saving pool statistics...', Log.LOG_TYPE.POOLS);
        await this._db.save("serverPool_statistics_confirmedAndPaid", this.poolBlocksConfirmedAndPaid );
        await this._db.save("serverPool_statistics_unconfirmed", this.poolBlocksUnconfirmed);

    }

    async _load(){

        Log.info('Loading pool statistics...', Log.LOG_TYPE.POOLS);
        let confirmedAndPaid = await this._db.get("serverPool_statistics_confirmedAndPaid", 30*1000, true);
        let unconfirmed = await this._db.get("serverPool_statistics_unconfirmed", 30*1000, true);

        if (typeof confirmedAndPaid !== "number") confirmedAndPaid = 0;
        if (typeof unconfirmed !== "number") unconfirmed = 0;

        this.poolBlocksConfirmedAndPaid = confirmedAndPaid;
        this.poolBlocksUnconfirmed = unconfirmed;

        return true;
    }

    async _clear(){

        Log.info('Clearing pool statistics...', Log.LOG_TYPE.POOLS);
        try {
            return (await this._db.remove("serverPool_statistics_confirmedAndPaid"));
        }
        catch(exception) {
            console.log('Exception on clear serverPool_statistics_confirmedAndPaid: ', exception);
            return false;
        }
    }

}

export default PoolStatistics;
