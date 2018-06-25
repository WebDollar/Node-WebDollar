import consts from 'consts/const_global';
import Serialization from "common/utils/Serialization";
import BufferExtended from 'common/utils/BufferExtended';
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import PoolDataMiner from "common/mining-pools/pool/pool-management/pool-data/Pool-Data-Miner";
import PoolDataBlockInformation from "common/mining-pools/pool/pool-management/pool-data/block-informations/Pool-Data-Block-Information"

const uuid = require('uuid');

class PoolData {

    constructor(poolManagement, databaseName) {

        this.poolManagement = poolManagement;
        this._db = new InterfaceSatoshminDB(databaseName ? databaseName : consts.DATABASE_NAMES.POOL_DATABASE);
        
        this.miners = [];
        this.blocksInfo = [];

        setTimeout( this.savePoolData.bind(this), 10000);

    }

    async initializePoolData(){

        await this.loadPoolData();

    }

    get lastBlockInformation(){

        if (this.blocksInfo.length === 0)
            this.addBlockInformation();

        return this.blocksInfo[this.blocksInfo.length-1];
    }

    updateRewards(){

        let blockInformation = this.lastBlockInformation;

        for (let i=0; i<blockInformation.blockInformationMinersInstances.length; i++)
            blockInformation.blockInformationMinersInstances[i].calculateReward();

        return true;
    }
    
    /**
     * @param minerAddress
     * @returns miner or null if it doesn't exist
     */
    getMiner(minerAddress){
        
        for (let i = 0; i < this.miners.length; ++i)
            if (this.miners[i].address.equals( minerAddress) )
                return this.miners[i];
                
        return null;
    }

    /**
     * @param minerAddress
     * @returns miner or null if it doesn't exist
     */
    getMinerInstanceByPublicKey(minerPublicKey){

        for (let i = 0; i < this.miners.length; ++i) {
            let instance = this.miners[i].findInstance(minerPublicKey);
            if (instance !== null)
                return instance;
        }

        return null;
    }
    
    /**
     * Insert a new miner if not exists. Synchronizes with DB.
     * @param minerAddress
     * @param minerReward
     * @returns true/false
     */
    async addMiner(minerAddress, minerPublicKey, minerReward = 0){
        
        if (this.getMiner(minerAddress) === null) {

            if ( !Buffer.isBuffer(minerAddress) || minerAddress.length !== consts.ADDRESSES.ADDRESS.LENGTH )
                throw {message: "miner address is invalid" };


            this.miners.push( new PoolDataMiner( this, uuid.v4(), minerAddress, minerPublicKey, minerReward, [] ) );

            return this.miners[this.miners.length-1]

        }
        
        return false; //miner already exists
    }

    addBlockInformation(){

        let blockInformation = new PoolDataBlockInformation(this.poolManagement, this.blocksInfo.length, undefined );
        this.blocksInfo.push(blockInformation);

        return blockInformation;
    }

    findBlockInformation(blockInformation){

        for (let i=0; i<this.blocksInfo.length; i++)
            if (blockInformation === this.blocksInfo[i])
                return i;

        return -1;

    }

    deleteBlockInformationByIndex(index){
        this.blocksInfo[index].destroyPoolDataBlockInformation(  );
        this.blocksInfo.splice(index, 1);
    }

    deleteBlockInformation(blockInformation){

        let position = this.findBlockInformation(blockInformation);
        if (position === -1) return null;

        blockInformation.destroyPoolDataBlockInformation(  );

        this.blocksInfo.splice(position, 1);
    }


    
    /**
     * Remove a miner if exists. Synchronizes with DB.
     * @param minerAddress
     * @returns true/false 
     */
    async removeMiner(minerAddress){

        let response = this.getMiner(minerAddress);

        if (response === null)
            return false; //miner doesn't exists
        
        let index = response.index;
        
        this.miners[index] = this.miners[this.miners.length - 1];
        this.miners.pop();
        
        return true;
    }




    _serializeMiners() {

        let list = [Serialization.serializeNumber4Bytes(this.miners.length)];

        for (let i = 0; i < this.miners.length; ++i)
            list.push(this.miners[i].serializeMiner());

        return Buffer.concat(list);
    }
    
    _deserializeMiners(buffer, offset = 0) {

        try {
            
            let numMiners = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 4 ) );
            offset += 4;

            this.miners = [];
            for (let i = 0; i < numMiners; ++i) {

                let miner = new PoolDataMiner(this, 0, undefined, undefined);
                offset = miner.deserializeMiner(buffer, offset );

                if (miner.instances.length)
                    this.miners.push(miner);

            }

            return true;

        } catch (exception){
            console.log("Error deserialize minersList. ", exception);
            throw exception;
        }
    }


    _serializeBlockInformation(){

        let list = [Serialization.serializeNumber4Bytes(this.blocksInfo.length)];

        for (let i = 0; i < this.blocksInfo.length; ++i)
            list.push(this.blocksInfo[i].serializeBlockInformation());

        return Buffer.concat(list);
    }

    _deserializeBlockInformation(buffer, offset = 0){

        try {

            let numBlocksInformation = Serialization.deserializeNumber( BufferExtended.substr( buffer, offset, 4 ) );
            offset += 4;

            this.blocksInfo = [];
            for (let i = 0; i < numBlocksInformation; ++i) {

                let blockInformation = new PoolDataBlockInformation(this.poolManagement, this.blocksInfo.length, undefined);
                offset = blockInformation.deserializeBlockInformation(buffer, offset );

                if (blockInformation.blockInformationMinersInstances.length > 0)
                    this.blocksInfo.push(blockInformation);

            }

            if ( this.blocksInfo.length > 0 && this.blocksInfo[this.blocksInfo.length-1].block !== undefined ){
                this.addBlockInformation();
            }

            return true;

        } catch (exception){
            console.log("Error deserialize blocksInfo. ", exception);
            throw exception;
        }

    }
    
    /**
     * Load miners from database
     * @returns {boolean} true is success, otherwise false
     */
    async loadMinersList() {
        
        try{

            let buffer = await this._db.get("minersList",  60000, true);

            if (buffer !== null) {
                let response = this._deserializeMiners(buffer);
                if (response !== true){
                    console.log('Unable to load miners from DB');
                    return false;
                }

            }


            return true;
        }
        catch (exception){

            console.log('ERROR loading miners from BD: ',  exception);
            return false;
        }
    }

    async loadBlockInformations(){

        try{

            let buffer = await this._db.get("blocksInformation", 60000, true);

            if (buffer !== null) {
                let response = this._deserializeBlockInformation(buffer);

                if (response !== true) {
                    console.log('Unable to load miners from DB');
                    return false;
                }
            }

            return true;

        } catch (exception){

        }

    }

    /**
     * Save miners to database
     * @returns {boolean} true is success, otherwise false
     */
    async saveMinersList() {

        try{

            let buffer = this._serializeMiners();

            let response = await this._db.save("minersList", buffer);
            if (response !== true) {
                console.log('Unable to save miners to DB');
                return false;
            }
            
            return true;
        }
        catch (exception){

            console.log('ERROR saving miners in DB: ',  exception);
            return false;
        }
    }

    /**
     * Save miners to database
     * @returns {boolean} true is success, otherwise false
     */
    async saveBlocksInformation() {

        try{

            let buffer = this._serializeBlockInformation();

            let response = await this._db.save("blocksInformation", buffer);
            if (response !== true) {
                console.log('Unable to save miners to DB');
                return false;
            }

            return true;
        }
        catch (exception){

            console.log('ERROR saving miners in DB: ',  exception);
            return false;
        }
    }

    async savePoolData(){

        let answer = false;

        if (this.poolManagement.poolStarted) {
            try {

                answer = await this.saveMinersList();
                answer = answer && (await this.saveBlocksInformation());


            } catch (exception) {

                console.error("SavePoolData: ", exception.message);
            }
        }

        setTimeout( this.savePoolData.bind(this), 10000);
        return answer;
    }

    loadPoolData(){

        let answer = this.loadMinersList();
        answer = answer && this.loadBlockInformations();

        return answer;
    }

    /**
     * @param minersList
     * @returns {boolean} true if this.miners === minersList
     */
    compareMinersList(minersList) {

        if (minersList.length !== this.miners.length)
            return true;

        for (let i = 0; i < this.miners; ++i){
            if (this.miners[i].address !== minersList[i].address)
                return true;
        }

        return false;
    }

    /**
     * @param miner1
     * @param miner2
     * @returns {boolean} true if miners are equal
     */
    static compareMiners(miner1, miner2) {

        return miner1 === miner2 || miner1.address === miner2.address;

    }

}

export default PoolData;