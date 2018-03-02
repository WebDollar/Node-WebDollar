import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import InterfaceBlockchainBlocks from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Blocks'
import InterfaceBlockchainBlockData from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Data'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'

import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'

import InterfaceBlockchainForksAdministrator from './forks/Interface-Blockchain-Forks-Administrator'
import InterfaceBlockchainTipsAdministrator from './tips/Interface-Blockchain-Tips-Administrator'

import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'

import InterfaceBlockchainTransactions from 'common/blockchain/interface-blockchain/transactions/Interface-Blockchain-Transactions'

import consts from 'consts/const_global'
import global from "consts/global"

import Serialization from 'common/utils/Serialization';
import SemaphoreProcessing from "common/utils/Semaphore-Processing"

import InterfaceBlockchainBlockValidation from "common/blockchain/interface-blockchain/blocks/validation/Interface-Blockchain-Block-Validation"

import BlockchainTimestamp from "common/blockchain/interface-blockchain/timestmap/Blockchain-Timestamp"


const SEMAPHORE_PROCESSING_INTERVAL = 10;

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchain {


    constructor (agent){

        this.agent = agent;

        this.blocks = new InterfaceBlockchainBlocks(this);

        this.mining = undefined;

        this._blockchainFileName = consts.DATABASE_NAMES.BLOCKCHAIN_DATABASE_FILE_NAME;
        this.db = new InterfaceSatoshminDB(consts.DATABASE_NAMES.BLOCKCHAIN_DATABASE);


        this.transactions = new InterfaceBlockchainTransactions();

        this.forksAdministrator = new InterfaceBlockchainForksAdministrator ( this );
        this.tipsAdministrator = new InterfaceBlockchainTipsAdministrator( this );

        this.blockCreator = new InterfaceBlockchainBlockCreator( this, this.db, InterfaceBlockchainBlock, InterfaceBlockchainBlockData);

        this.timestamp = new BlockchainTimestamp();

        this.semaphoreProcessing = new SemaphoreProcessing(SEMAPHORE_PROCESSING_INTERVAL);
    }

    _setAgent(newAgent){

        this.agent = newAgent;
        this.forksAdministrator.initialize(this);
        this.tipsAdministrator.initialize(this);
    }

    async validateBlockchain(){

        for (let i = this.blocks.blocksStartingPoint; i < this.blocks.length; i++)
            if (! (await this.validateBlockchainBlock(this.blocks[i])) )
                return false;

        return true;
    }

    async simulateNewBlock(block, revertAutomatically, callback){
        return await callback();
    }

    async blockIncluded(block){

    }

    /**
     * Include a new block at the end of the blockchain, by validating the next block
        Will save the block in the blockchain, if it is valid
     * @param block
     * @param resetMining
     * @param socketsAvoidBroadcast
     * @returns {Promise.<boolean>}
     */
    async includeBlockchainBlock(block, resetMining, socketsAvoidBroadcast, saveBlock){

        if (block.reward === undefined)
            block.reward = BlockchainMiningReward.getReward(block.height);

        if (saveBlock === undefined)
            saveBlock = true;

        if (this.transactions.uniqueness.searchTransactionsUniqueness(block.data.transactions))
            throw "transaction already processed";

        if (block.blockValidation === undefined)
            block.blockValidation = this.createBlockValidation();

        if (! (await this.validateBlockchainBlock(block)) ) // the block has height === this.blocks.length
            return false;


        //let's check again the heights
        if (block.height !== this.blocks.length)
            throw ('height of a new block is not good... '+ block.height + " "+ this.blocks.length);

        this.blocks.addBlock(block);

        await this.blockIncluded(block);

        if (saveBlock) {
            await this.saveNewBlock(block);

            // propagating a new block in the network
            this.propagateBlocks(block.height, socketsAvoidBroadcast)
        }


        if (resetMining && this.mining !== undefined  && this.mining !== null) //reset mining
            this.mining.resetMining();

        return true;
    }

    /**
     * Validate the block, but the Block WAS NOT ADDED in the blockchain array
     * @param block
     * @param prevDifficultyTarget
     * @param prevHash
     * @param prevTimeStamp
     * @param blockValidationType
     * @returns {Promise.<boolean>}
     */
    async validateBlockchainBlock( block ){

        if ( block instanceof InterfaceBlockchainBlock === false )
            throw ('block '+block.height+' is not an instance of InterfaceBlockchainBlock ');

        // in case it is not a fork controlled blockchain

        if (block.height === 0 ) {
            //validate genesis
            BlockchainGenesis.validateGenesis(block);
        }

        if (block.blockValidation === undefined)
            block.blockValidation = this.createBlockValidation();

        block.difficultyTargetPrev = block.blockValidation.getDifficultyCallback(block.height);

        //for fork 3.1
        if ( block.height < consts.BLOCKCHAIN.HARD_FORKS.TEST_NET_3.DIFFICULTY_HARD_FORK )
            block.blockValidation['skip-validation-timestamp'] = true;

        //validate difficulty & hash
        if (! (await block.validateBlock(block.height)))
            throw ('block validation failed');

        //recalculate next target difficulty
        if ( block.height < consts.BLOCKCHAIN.HARD_FORKS.TEST_NET_3.DIFFICULTY_HARD_FORK || !block.blockValidation.blockValidationType['skip-difficulty-recalculation'] ){

            //console.log("block.difficultyTarget", prevDifficultyTarget.toString("hex"), prevTimeStamp, block.timeStamp, block.height);

            block.difficultyTarget = block.blockValidation.getDifficulty( block.timeStamp, block.height );

            block.difficultyTarget = Serialization.serializeToFixedBuffer( consts.BLOCKCHAIN.BLOCKS_POW_LENGTH, Serialization.serializeBigInteger(block.difficultyTarget) );

            console.warn(" computed ", block.difficultyTarget.toString("hex"), " from ", block.difficultyTargetPrev.toString("hex") )
        }

        return true;
    }

    getBlockchainStartingPoint(){
        return this.blocks.blocksStartingPoint;
    }


    getDifficultyTarget(height){

        if (height === undefined)
            height = this.blocks.length;

        if (height <= 0)
            return BlockchainGenesis.difficultyTarget;
        else{
            if (height > this.blocks.length )
                throw "getDifficultyTarget invalid height "+height+" "+this.blocks.length; else
            if (this.blocks[height-1] === undefined)
                throw "getDifficultyTarget invalid height"+height+" "+this.blocks.length;

            return this.blocks[height-1].difficultyTarget;
        }

    }

    getTimeStamp(height){
        if (height === undefined) height = this.blocks.length;

        if (height <= 0)
            return BlockchainGenesis.timeStamp;
        else{
            if (height > this.blocks.length )
                throw "getTimeStamp invalid height";
            else
            if (this.blocks[height-1] === undefined)
                throw "getTimeStamp invalid height";

            return this.blocks[height-1].timeStamp;
        }
    }

    getHashPrev(height){
        
        if (height === undefined)
            height = this.blocks.length;

        if (height <= 0)
            return BlockchainGenesis.hashPrev;
        else {
            if (height > this.blocks.length )
                throw "getHashPrev invalid height";
            else
            if (this.blocks[height-1] === undefined)
                throw "getHashPrev invalid height";

            return this.blocks[height-1].hash;
        }
    }

    toString(){

    }

    toJSON(){

    }

    async saveNewBlock(block){

        if (process.env.BROWSER)
            return true;

        if (await this.db.save(this._blockchainFileName, this.blocks.length) !== true){
            console.error("Error saving the blocks.length");
            return false;
        }

        await block.saveBlock();

        return true;
    }

    async saveBlockchain(onlyLastBlocks){

        if (process.env.BROWSER)
            return true;

        //save the number of blocks
        let result = true;

        if (await this.db.save(this._blockchainFileName, this.blocks.length) !== true){
            console.error("Error saving the blocks.length");
        } else {

            let indexStart = 0;

            if (onlyLastBlocks !== undefined){
                indexStart = this.blocks.length - onlyLastBlocks;
            }


            for (let i = indexStart; i < this.blocks.length; ++i)

                if (this.blocks[i] !== undefined && this.blocks[i] !== null) {
                    let response = await this.blocks[i].saveBlock();

                    if (response !== true)
                        break;
                }
        }

        return result;
    }

    _getLoadBlockchainValidationType(indexStart, i, numBlocks, onlyLastBlocks){

        return {};

    }

    async loadBlockchain(onlyLastBlocks = undefined){

        if (process.env.BROWSER)
            return true;

        //load the number of blocks
        let numBlocks = await this.db.get(this._blockchainFileName);
        if (numBlocks === null ) {
            console.error("numBlocks was not found");
            return false;
        }

        console.warn("validateLastBlocks", numBlocks);
        console.warn("validateLastBlocks", numBlocks);
        console.warn("validateLastBlocks", numBlocks);

        this.blocks.clear();

        try {

            let indexStart = 0;

            if (this.agent !== undefined && this.agent.light === true) {

                indexStart = Math.max(0, numBlocks - onlyLastBlocks-1);

                this.blocks.length = indexStart||0; // marking the first blocks as undefined
            }

            for (let i = indexStart; i < numBlocks; ++i) {

                let validationType = this._getLoadBlockchainValidationType(indexStart, i, numBlocks, onlyLastBlocks);

                console.log("validationType", validationType);

                let blockValidation = new InterfaceBlockchainBlockValidation( this.getDifficultyTarget.bind(this), this.getTimeStamp.bind(this), this.getHashPrev.bind(this), validationType );

                await this._loadBlock(indexStart, i, blockValidation);

            }

        } catch (exception){
            console.error("blockchain.load raised an exception", exception);
            return false;
        }

        return true;
    }


    async _loadBlock(indexStart, i, blockValidation){

        let block = this.blockCreator.createEmptyBlock(i, blockValidation);
        block.height = i;

        try{

            if (await block.loadBlock() === false)
                throw "no block to load was found";

            //it will include the block, but it will not ask to save, because it was already saved before

            if (await this.includeBlockchainBlock(block, undefined, "all", false) ) {
                console.warn("blockchain loaded successfully index ", i);
            }
            else {
                console.error("blockchain is invalid at index " + i);
                throw "blockchain is invalid at index "+i;
            }


        } catch (exception){
            console.error("blockchain LOADING stopped at " + i, exception);
            throw exception;
        }

        return block;
    }

    async removeBlockchain(index, removeFiles = true){

        if (removeFiles === true) {
            for (let i = index; i < this.blocks.length; ++i){
                let response = await this.blocks[i].removeBlock();

                if (response !== true)
                    return response;
            }
        }

        this.blocks.spliceBlocks(index);

        return true;
    }


    // aka head
    get last() {
        return this.blocks[this.blocks.length - 1];
    }

    // aka tail
    get first() {
        return this.blocks[0];
    }

    propagateBlocks(height, socketsAvoidBroadcast){

        if (this.agent !== undefined) {
            for (let i = Math.max(0, height); i < this.blocks.length; i++) {
                console.log("PROPAGATE " ,height, " sockets", socketsAvoidBroadcast.length);

                if (this.blocks[i] === undefined)
                    console.error("PROPAGATE ERROR"+i, this.blocks[i]);
                else {
                    console.log("PROPAGATING", this.blocks[i].hash.toString("hex"));
                    this.agent.protocol.propagateHeader(this.blocks[i], this.blocks.length, socketsAvoidBroadcast);
                }
            }

        }
    }

    createBlockValidation(){
        return new InterfaceBlockchainBlockValidation( this.getDifficultyTarget.bind(this), this.getTimeStamp.bind(this), this.getHashPrev.bind(this), {} );
    }


}

export default InterfaceBlockchain;