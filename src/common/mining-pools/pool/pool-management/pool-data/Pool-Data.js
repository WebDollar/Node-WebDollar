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

        if ( !Buffer.isBuffer(minerAddress) || minerAddress.length !== consts.ADDRESSES.ADDRESS.LENGTH )
            throw {message: "miner address is invalid" };

        let miner = this.findMiner(minerAddress);

        if ( !miner ) {

            miner = new PoolDataMiner( this, uuid.v4(), minerAddress, minerReward, [] );
            this.miners.push( miner );

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

        let lists = [Serialization.serializeNumber4Bytes(this.miners.length)];

        let buffer = [];

        for (let i = 0; i < this.miners.length; ++i) {

            buffer.push(this.miners[i].serializeMiner());

            if ( buffer.length === 100) {
                await Utils.sleep(100);
                lists.push(Buffer.concat(buffer));
                buffer = [];
            }

        }

        if (buffer.length > 0)
            lists.push(Buffer.concat(buffer));

        return lists;
    }

    _deserializeMiners(buffer, offset = 0, numMiners) {

        try {

            for (let i = 0; i < numMiners; ++i) {

                let miner = new PoolDataMiner( this, i );
                offset = miner.deserializeMiner(buffer, offset );

                if (!this.findMiner(miner.address))
                    this.miners.push(miner);

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
    async _loadMinersList() {

        try{

            this.miners = [];

            let buffer = await this._db.get("minersList_0",  60000, true);
            if (buffer){

                let numMiners = Serialization.deserializeNumber4Bytes(buffer, 0);

                let i = 0, index = 1;
                while (i < numMiners) {

                    buffer = await this._db.get("minersList_" + index, 60000, true);

                    let response = this._deserializeMiners( buffer, 0, (numMiners - i) % 101 );
                    if ( !response )
                        throw 'Unable to load miners from DB'

                    i += 100;
                    index++;
                }

            } else {

                buffer = await this._db.get("minersList",  60000, true);
                let offset = 0;

                if (buffer) {
                    let numMiners = Serialization.deserializeNumber4Bytes(buffer, offset);
                    offset += 4;

                    let response = this._deserializeMiners(buffer, offset, numMiners);
                    if (!response)
                        throw 'Unable to load miners from DB';
                }


            }

            for (let i=0; i< this.miners.length; i++) {
                this.miners[i].referrals.findReferralLinkAddress();
                this.miners[i].referrals.refreshRefereeAddresses();
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
    async saveMinersList() {

        try{

            let lists = await this._serializeMiners();

            for (let i=0; i < lists.length; i++){

                let response = await this._db.save("minersList_"+i, lists[i] );

                if ( !response )
                    throw 'Unable to save miners to DB'

                await this.poolManagement.blockchain.sleep(500);
            }


            return true;
        }
        catch (exception){

            console.log('ERROR saving miners in DB: ',  exception);
            return false;
        }
    }


    async _serializeBlockInformation(){

        console.info("SAVING POOL DATA");

        let lists = [ Serialization.serializeNumber4Bytes(this.blocksInfo.length) ];

        for (let blockInfo of this.blocksInfo){

            lists.push( blockInfo.serializeBlockInformation() );

            if ( blockInfo.blockInformationMinersInstances.length > 100)
                await this.poolManagement.blockchain.sleep(500);

        }

        console.info("SAVE DONE");

        return lists;
    }

    async _deserializeBlockInformation(buffer, offset = 0, numBlocksInformation){

        try {

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


            return true;

        } catch (exception){
            console.log("Error deserialize blocksInfo. ", exception);
            throw exception;
        }

    }

    async _loadBlockInformations(){

        if (consts.DEBUG) {
            console.log('Pool Data is not loaded in Debug');
            return true;
        }

        this.blocksInfo = [];

        try{

            let buffer = await this._db.get("blocksInformation_0", 60000, true);
            if (buffer){

                    let numBlocksInformation = Serialization.deserializeNumber4Bytes(buffer, 0,);

                    for (let i=0; i < numBlocksInformation; i++){

                        buffer = await this._db.get("blocksInformation_"+(i+1), 60000, true);
                        let response = await this._deserializeBlockInformation(buffer, 0, 1);
                        if ( !response )
                            throw 'Unable to load miners from DB'
                    }

            } else {

                buffer = await this._db.get("blocksInformation", 60000, true);
                let offset = 0;

                if (buffer) {
                    let numBlocksInformation = Serialization.deserializeNumber4Bytes(buffer, offset,);
                    offset += 4;

                    let response = await this._deserializeBlockInformation(buffer, offset, numBlocksInformation);
                    if (!response)
                        throw 'Unable to load miners from DB'
                }


            }

            if ( this.blocksInfo.length > 0 && this.blocksInfo[this.blocksInfo.length-1].block && this.blocksInfo[this.blocksInfo.length-1].blockInformationMinersInstances.length > 0)
                this.addBlockInformation();

            console.warn("==========================================================");
            console.warn("POOLS BLOCK INFORMATION LOADED: " + this.blocksInfo.length);
            console.warn("==========================================================");

            return true;

        } catch (exception){
            console.log('Unable to load miners from DB');
            return false;
        }

    }



    /**
     * Save miners to database
     * @returns {boolean} true is success, otherwise false
     */
    async saveBlocksInformation() {

        try{

            let lists = await this._serializeBlockInformation();

            for (let i=0; i < lists.length; i++){

                let response = await this._db.save("blocksInformation_"+i, lists[i] );

                if ( !response )
                    throw 'Unable to save miners to DB'

                await this.poolManagement.blockchain.sleep(500);
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

                await Utils.sleep(3000);

                answer = answer && (await this.saveBlocksInformation());


            } catch (exception) {

                console.error("SavePoolData: ", exception.message);
            }

            global.POOL_SAVED = true;
        }

        setTimeout( this._savePoolData.bind(this), 3*60*1000);
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