import consts from 'consts/const_global';
import Serialization from "common/utils/Serialization";
import BufferExtended from 'common/utils/BufferExtended';
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import ServerPoolDataPool from "./Server-Pool-Data-Pool";

const uuid = require('uuid');

class ServerPoolData {

    constructor(poolManagement, databaseName) {

        this.poolManagement = poolManagement;
        this._db = new InterfaceSatoshminDB(databaseName ? databaseName : consts.DATABASE_NAMES.SERVER_POOL_DATABASE);

        this.pools = [];

    }

    /**
     * @param minerAddress
     * @returns miner or null if it doesn't exist
     */
    getPool(poolAddress){

        for (let i = 0; i < this.pools.length; ++i)
            if (this.pools[i].address.equals( poolAddress ))
                return this.pools[i];

        return null;
    }

    /**
     * Insert a new miner if not exists. Synchronizes with DB.
     * @param minerAddress
     * @param minerReward
     * @returns true/false
     */
    async addPool(poolAddress, poolReward = 0){

        if (this.getPool(poolAddress) === null) {

            if ( !Buffer.isBuffer(poolAddress) || poolAddress.length !== consts.ADDRESSES.ADDRESS.LENGTH )
                throw {message: "pool address is invalid" };


            this.miners.push( new PoolDataMiner( uuid.v4(), poolAddress, poolReward, [] ) );

            return (await this.saveServerPoolsList());

        }

        return false; //miner already exists
    }



    /**
     * Remove a miner if exists. Synchronizes with DB.
     * @param minerAddress
     * @returns true/false
     */
    async removePool(poolAddress){

        let response = this.getMiner(poolAddress);

        if (response === null)
            return false; //miner doesn't exists

        let index = response.index;

        this.pools[index] = this.pools[this.pools.length - 1];
        this.pools.pop();

        return (await this.savePoolsList());
    }




    _serializeServerPools() {

        let list = [ Serialization.serializeNumber4Bytes(this.pools.length) ];

        for (let i = 0; i < this.pools.length; ++i)
            list.push( this.pools[i].serializeServerPoolData() );

        return Buffer.concat(list);
    }

    _deserializeServerPools(buffer, offset = 0) {

        try {

            let numPools = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 4 ) );
            offset += 4;

            this.miners = [];
            for (let i = 0; i < numPools; ++i) {

                let miner = new ServerPoolDataPool(0, undefined, []);
                offset = miner.deserializeServerPoolData( buffer, offset );

            }

            return true;

        } catch (exception){
            console.log("Error deserialize minersList. ", exception);
            throw exception;
        }
    }

    /**
     * Load miners from database
     * @returns {boolean} true is success, otherwise false
     */
    async loadServerPoolsList() {

        try{

            let buffer = await this._db.get("ServersPoolList", 60000, true);

            if (buffer === null) return true; //nothing to load

            let response = this._deserializeServerPools(buffer);

            if (response !== true){
                console.log('Unable to load poolsList from DB');
                return false;
            }

            return true;
        }
        catch (exception){

            console.log('ERROR loading miners from BD: ',  exception);
            return false;
        }
    }


    /**
     * Save miners to database
     * @returns {boolean} true is success, otherwise false
     */
    async saveServerPoolsList() {

        try{

            let buffer = this._serializeServerPools();

            let response = await this._db.save("ServersPoolList", buffer);
            if (response !== true) {
                console.log('Unable to save poolsList to DB');
                return false;
            }

            return true;
        }
        catch (exception){

            console.log('ERROR saving pools in DB: ',  exception);
            return false;
        }
    }


}

export default ServerPoolData;