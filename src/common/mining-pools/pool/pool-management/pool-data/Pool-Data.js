import consts from 'consts/const_global';
import Serialization from "common/utils/Serialization";
import BufferExtended from 'common/utils/BufferExtended';
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import PoolDataMiner from "common/mining-pools/pool/pool-management/pool-data/miners/Pool-Data-Miner";
import PoolDataBlockInformation from "common/mining-pools/pool/pool-management/pool-data/block-informations/Pool-Data-Block-Information"
import Blockchain from 'main-blockchain/Blockchain';
import Utils from "common/utils/helpers/Utils";
import PoolDataConnectedMinerInstances from "./Pool-Data-Connected-Miner-Instances";
import global from "consts/global"

const uuid = require('uuid');

class PoolData {

    constructor(poolManagement, databaseName) {

        this.poolManagement = poolManagement;
        this._db = new InterfaceSatoshminDB(databaseName ? databaseName : consts.DATABASE_NAMES.POOL_DATABASE);

        this.miners = [];
        this.blocksInfo = [];

        setTimeout( this._savePoolData.bind(this), 30000);

        this.connectedMinerInstances = new PoolDataConnectedMinerInstances(poolManagement);
    }

    async initializePoolData(){

        return await this._loadPoolData();

    }

    get lastBlockInformation(){

        if (this.blocksInfo.length === 0)
            this.addBlockInformation();

        return this.blocksInfo[this.blocksInfo.length-1];
    }

    get confirmedBlockInformations(){

        let blocksConfirmed = [];
        for (let i=0; i<this.blocksInfo.length; i++)
            if (this.blocksInfo[i].confirmed && !this.blocksInfo[i].payout)
                blocksConfirmed.push(this.blocksInfo[i]);

        return blocksConfirmed;
    }

    updateRewards(){

        let blockInformation = this.lastBlockInformation;

        for (let i=0; i<blockInformation.blockInformationMinersInstances.length; i++)
            blockInformation.blockInformationMinersInstances[i].calculateReward();

        return true;
    }

    findMiner(minerAddress, returnPos = false){

        for (let i = 0; i < this.miners.length; ++i)
            if (this.miners[i].address.equals( minerAddress) )
                return (returnPos ? i : this.miners[i]);

        return returnPos ? -1 : null;
    }

    /**
     * @param minerAddress
     * @returns miner or null if it doesn't exist
     */
    getMinerInstance(socket){
        return socket.node.protocol.minerPool.minerInstance;
    }

    /**
     * Insert a new miner if not exists. Synchronizes with DB.
     * @param minerAddress
     * @param minerReward
     * @returns true/false
     */
    addMiner(minerAddress, minerReward = 0){

        let miner = this.findMiner(minerAddress);
        if ( !miner ) {

            if ( !Buffer.isBuffer(minerAddress) || minerAddress.length !== consts.ADDRESSES.ADDRESS.LENGTH )
                throw {message: "miner address is invalid" };


            this.miners.push( new PoolDataMiner( this, uuid.v4(), minerAddress, minerReward, [] ) );

            miner = this.miners[this.miners.length-1]

        }

        return miner; //miner already exists
    }

    addBlockInformation(){

        let blockInformation = new PoolDataBlockInformation(this.poolManagement, this.blocksInfo.length, undefined, undefined, undefined, Blockchain.blockchain.blocks.length );
        this.blocksInfo.push(blockInformation);

        return blockInformation;
    }

    findBlockInformation(blockInformation, returnPos = false){

        for (let i=0; i<this.blocksInfo.length; i++)
            if (blockInformation === this.blocksInfo[i])
                return returnPos ? i : this.blocksInfo[i];

        return returnPos ? -1 : null;

    }


    deleteBlockInformation(index){

        if (typeof index !== "number") index = this.findBlockInformation(index, true);

        if (index === -1) return false; //miner doesn't exists

        this.blocksInfo[index].destroyPoolDataBlockInformation(  );
        this.blocksInfo.splice(index, 1);

        return true;
    }


    /**
     * Remove a miner if exists. Synchronizes with DB.
     * @param minerAddress
     * @returns true/false
     */
    async removeMiner(minerAddress){

        let pos;
        if (typeof minerAddress !== "number")  pos = this.findMiner(minerAddress, true);
        else pos = minerAddress;

        if (pos === -1) return false; //miner doesn't exists

        this.miners[pos].destroyPoolDataMiner();
        this.miners[pos] = this.miners[this.miners.length - 1];
        this.miners.pop();

        return true;
    }




    async _serializeMiners() {

        let list = [Serialization.serializeNumber4Bytes(this.miners.length)];

        for (let i = 0; i < this.miners.length; ++i) {
            list.push(this.miners[i].serializeMiner());

            if (this.miners.length % 10 === 0)
                await Utils.sleep(10)

        }

        return Buffer.concat(list);
    }

    _deserializeMiners(buffer, offset = 0) {

        try {

            let numMiners = Serialization.deserializeNumber4Bytes( buffer, offset );
            offset += 4;

            this.miners = [];
            for (let i = 0; i < numMiners; ++i) {

                let miner = new PoolDataMiner(this, i );
                offset = miner.deserializeMiner(buffer, offset );

                this.miners.push(miner);

            }

            for (let i=0; i< this.miners.length; i++) {
                this.miners[i].referrals.findReferralLinkAddress();
                this.miners[i].referrals.refreshRefereeAddresses();
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

    async _deserializeBlockInformation(buffer, offset = 0){

        try {

            let numBlocksInformation = Serialization.deserializeNumber4Bytes( buffer, offset, );
            offset += 4;

            this.blocksInfo = [];

            console.info("Pool Blocks Data Length", numBlocksInformation);

            for (let i = 0; i < numBlocksInformation && offset < buffer.length; i++) {

                console.info("Pool Blocks Data", i ) ;

                let blockInformation = new PoolDataBlockInformation(this.poolManagement, this.blocksInfo.length, undefined, undefined, undefined, Blockchain.blockchain.blocks.length );
                offset = await blockInformation.deserializeBlockInformation(buffer, offset );

                if (blockInformation.blockInformationMinersInstances.length > 0) {

                    this.blocksInfo.push(blockInformation);

                    for (let j = 0; j < blockInformation.blockInformationMinersInstances.length; j++)
                        blockInformation.blockInformationMinersInstances[j].calculateReward(false);
                }

            }


            if ( this.blocksInfo.length > 0 && this.blocksInfo[this.blocksInfo.length-1].block && this.blocksInfo[this.blocksInfo.length-1].blockInformationMinersInstances.length > 0){
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
    async _loadMinersList() {

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

    async _loadBlockInformations(){

        try{

            let buffer = await this._db.get("blocksInformation", 60000, true);

            if (buffer !== null) {

                if (consts.DEBUG) {
                    console.log('Pool Data is not loaded in Debug');
                    return true;
                }

                let response = await this._deserializeBlockInformation(buffer);

                if (response !== true) {
                    console.log('Unable to load miners from DB');
                    return false;
                }

                console.warn("==========================================================");
                console.warn("POOLS BLOCK INFORMATION LOADED: " + this.blocksInfo.length);
                console.warn("==========================================================");

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

            let buffer = await this._serializeMiners();

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

            console.log('ERROR saving block information in DB: ',  exception);
            return false;
        }
    }

    async _savePoolData(){

        let answer = false;

        if (this.poolManagement.poolStarted) {

            global.POOL_SAVED = false;

            try {

                answer = await this.saveMinersList();
                await Utils.sleep(1000);
                answer = answer && (await this.saveBlocksInformation());


            } catch (exception) {

                console.error("SavePoolData: ", exception.message);
            }

            global.POOL_SAVED = true;
        }

        setTimeout( this._savePoolData.bind(this), 10000);
        return answer;
    }

    async _loadPoolData(){

        let answer = await this._loadMinersList();
        answer = answer && await this._loadBlockInformations();

        this._clearEmptyMiners();

        return answer;
    }

    /**
     * @param minersList
     * @returns {boolean} true if this.miners === minersList
     */
    _compareMinersList(minersList) {

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

    _clearEmptyMiners(){

        // for (let i=this.miners.length-1; i>=0; i--)
        //     if ( this.miners[i].referrals.referees.length === 0 && this.miners[i].referrals.referralLinkMiner !== undefined &&
        //         (this.miners[i].rewardTotal + this.miners[i].rewardConfirmed + this.miners[i].rewardConfirmedOther + this.miners[i].rewardSent + this.miners[i].referrals.rewardReferralsSent + this.miners[i].referrals.rewardReferralsConfirmed + this.miners[i].referrals.rewardReferralsTotal ) === 0) {
        //
        //
        //         //delete blockInformationMinerInstances
        //         this.blocksInfo.forEach((blockInfo)=>{
        //
        //             blockInfo.blockInformationMinersInstances.forEach((minerInstance, index)=>{
        //
        //                 if (minerInstance.address.equals(this.miners[i].address))
        //                     blockInfo._deleteBlockInformationMinerInstance(index);
        //
        //             });
        //
        //         });
        //
        //         this.miners[i].destroyPoolDataMiner();
        //         this.miners.splice(i, 1);
        //     }


    }

}

export default PoolData;