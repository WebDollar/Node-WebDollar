import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import InterfaceBlockchainBlocks from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Blocks'
import InterfaceBlockchainBlockData from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Data'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'

import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'

import InterfaceBlockchainForksAdministrator from './forks/Interface-Blockchain-Forks-Administrator'

import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'

import InterfaceBlockchainTransactions from 'common/blockchain/interface-blockchain/transactions/Interface-Blockchain-Transactions'

import consts from 'consts/const_global'
import global from "consts/global"

import Serialization from 'common/utils/Serialization';
import SemaphoreProcessing from "common/utils/Semaphore-Processing"

import InterfaceBlockchainBlockValidation from "common/blockchain/interface-blockchain/blocks/validation/Interface-Blockchain-Block-Validation"

import BlockchainTimestamp from "common/blockchain/interface-blockchain/timestmap/Blockchain-Timestamp"
import RevertActions from "common/utils/Revert-Actions/Revert-Actions";
import InterfaceBlockchainTipsAdministrator from "./tips/Interface-Blockchain-Tips-Administrator";
import NodeBlockchainPropagation from "common/sockets/protocol/propagation/Node-Blockchain-Propagation";

const SEMAPHORE_PROCESSING_INTERVAL = 10;

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchain {


    constructor (agent){

        this.agent = agent;

        this.blocks = new InterfaceBlockchainBlocks(this);

        this.mining = undefined;

        this._blockchainFileName = consts.DATABASE_NAMES.BLOCKCHAIN_DATABASE.FILE_NAME;
        this.db = new InterfaceSatoshminDB(consts.DATABASE_NAMES.BLOCKCHAIN_DATABASE.FOLDER);

        this.forksAdministrator = new InterfaceBlockchainForksAdministrator ( this );
        this.tipsAdministrator = new InterfaceBlockchainTipsAdministrator ( this );

        this._createBlockchainElements();

        this.timestamp = new BlockchainTimestamp();

        this.semaphoreProcessing = new SemaphoreProcessing(SEMAPHORE_PROCESSING_INTERVAL);
    }

    _setAgent(newAgent){
        this.agent = newAgent;
    }

    _createBlockchainElements(){
        this.transactions = new InterfaceBlockchainTransactions(this);
        this.blockCreator = new InterfaceBlockchainBlockCreator( this, this.db, InterfaceBlockchainBlock, InterfaceBlockchainBlockData);
    }

    async validateBlockchain(){

        for (let i = this.blocks.blocksStartingPoint; i < this.blocks.length; i++)
            if (! (await this.validateBlockchainBlock(this.blocks[i])) )
                return false;

        return true;
    }

    async simulateNewBlock(block, revertAutomatically, revertActions, callback){
        return await callback();
    }

    async _blockIncluded(block){

    }

    /**
     * Include a new block at the end of the blockchain, by validating the next block
        Will save the block in the blockchain, if it is valid
     * @param block
     * @param resetMining
     * @param socketsAvoidBroadcast
     * @returns {Promise.<boolean>}
     */
    async includeBlockchainBlock(block, resetMining, socketsAvoidBroadcast, saveBlock, revertActions){

        if (block.reward === undefined)
            block.reward = BlockchainMiningReward.getReward(block.height);

        if (saveBlock === undefined)
            saveBlock = true;

        if (block.blockValidation === undefined)
            block.blockValidation = this.createBlockValidation();
        else {

            block.blockValidation.getBlockCallBack = this.getBlock.bind(this);
            block.blockValidation.getDifficultyCallback = this.getDifficultyTarget.bind(this);
            block.blockValidation.getTimeStampCallback = this.getTimeStamp.bind(this);
            block.blockValidation.getHashPrevCallback = this.getHashPrev.bind(this);

        }


        if (! (await this.validateBlockchainBlock(block)) ) // the block has height === this.blocks.length
            return false;

        //let's check again the heights
        if (block.height !== this.blocks.length)
            throw {message: 'height of a new block is not good... ', height: block.height, blocksLength: this.blocks.length};

        this.blocks.addBlock(block);

        if ( revertActions !== undefined )
            revertActions.push( {name: "block-added", height: this.blocks.length-1 } );

        await this._blockIncluded( block);

        if (saveBlock) {

            await this.saveNewBlock(block);

            // propagating a new block in the network
            NodeBlockchainPropagation.propagateBlock( block, socketsAvoidBroadcast)
        }

        this._onBlockCreated(block,  saveBlock);

        if (resetMining && this.mining !== undefined  && this.mining !== null) //reset mining
            this.mining.resetMining();

        return true;
    }

    _onBlockCreated(block, saveBlock){

        if (saveBlock)
            this.blocks.recalculateNetworkHashRate();

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
            throw {message: 'block is not an instance of InterfaceBlockchainBlock ', height:block.height};

        // in case it is not a fork controlled blockchain

        if (block.height === 0 ) {
            //validate genesis
            BlockchainGenesis.validateGenesis(block);
        }

        if (block.blockValidation === undefined)
            block.blockValidation = this.createBlockValidation();

        block.difficultyTargetPrev = block.blockValidation.getDifficultyCallback(block.height);


        //validate difficulty & hash
        if (! (await block.validateBlock( block.height )))
            throw {message: 'block validation failed'};

        //recalculate next target difficulty
        if ( !block.blockValidation.blockValidationType['skip-difficulty-recalculation'] ){

            //console.log("block.difficultyTarget", prevDifficultyTarget.toString("hex"), prevTimeStamp, block.timeStamp, block.height);

            block.difficultyTarget = block.blockValidation.getDifficulty( block.timeStamp, block.height );

            block.difficultyTarget = Serialization.serializeBigNumber(block.difficultyTarget, consts.BLOCKCHAIN.BLOCKS_POW_LENGTH);

        }

        return true;
    }

    getBlock(height){
        if (height === undefined)
            height = this.blocks.length;

        if (height <= 0)
            return BlockchainGenesis;
        else{
            if (height > this.blocks.length ) throw {message: "getBlock invalid height ", height:height, blocksLength: this.blocks.length}; else
            if (this.blocks[height-1] === undefined) throw {message:"getBlock invalid height", height:height, blocksLength: this.blocks.length};

            return this.blocks[height-1];
        }

    }

    getDifficultyTarget(height){

        if (height === undefined)
            height = this.blocks.length;

        if (height <= 0)
            return BlockchainGenesis.difficultyTarget;
        else{
            if (height > this.blocks.length ) throw {message: "getDifficultyTarget invalid height ", height:height, blocksLength: this.blocks.length}; else
            if (this.blocks[height-1] === undefined) throw {message:"getDifficultyTarget invalid height", height:height, blocksLength: this.blocks.length};

            return this.blocks[height-1].difficultyTarget;
        }

    }

    getTimeStamp(height){
        if (height === undefined) height = this.blocks.length;

        if (height <= 0)
            return BlockchainGenesis.timeStamp;
        else{
            if (height > this.blocks.length ) throw {message: "getTimeStamp invalid height ", height: height}; else
            if (this.blocks[height-1] === undefined) throw {message: "getTimeStamp invalid height ", height: height};

            return this.blocks[height-1].timeStamp;
        }
    }

    getHashPrev(height){
        
        if (height === undefined)
            height = this.blocks.length;

        if (height <= 0)
            return BlockchainGenesis.hashPrev;
        else {

            if (height > this.blocks.length ) throw {message: "getHashPrev invalid height", height: height}; else
            if (this.blocks[height-1] === undefined) throw {message: "getHashPrev invalid height", height: height};

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

    async saveBlockchain(startingHeight, endingHeight){

        if (process.env.BROWSER)
            return true;

        //save the number of blocks
        let result = true;

        if (await this.db.save(this._blockchainFileName, this.blocks.length) !== true)
            console.error("Error saving the blocks.length");
        else {

            if (startingHeight === undefined) startingHeight = this.blocks.blocksStartingPoint;
            if (endingHeight === undefined) endingHeight = this.blocks.length;

            console.warn("Saving Blockchain. Starting from ", startingHeight, endingHeight);
            for (let i = startingHeight; i < endingHeight; i++ )

                if (this.blocks[i] !== undefined && this.blocks[i] !== null) {

                    if (! ( await this.blocks[i].saveBlock()) )
                        break
                }
            console.warn("Successfully saving blocks ", startingHeight, endingHeight);
        }

        return result;
    }

    _getLoadBlockchainValidationType(indexStart, i, numBlocks, indexStartProcessingOffset){

        let validationType = {};

        if (indexStartProcessingOffset !== undefined ){

            //fast loading Blockchain
            if ( i <= indexStartProcessingOffset ){

                validationType["skip-prev-hash-validation"] = true;
                validationType["skip-accountant-tree-validation"] = true;
                validationType["skip-mini-blockchain-simulation"] = true;
                validationType["skip-validation-transactions-from-values"] = true;
                validationType["skip-validation-timestamp"] = true;
                validationType["validation-timestamp-adjusted-time"] = false;
                validationType["skip-block-data-validation"] = true;
                validationType["skip-block-data-transactions-validation"] = true;
                validationType["skip-validation-interlinks"] = true;
                validationType["skip-validation"] = true;
                validationType["skip-interlinks-update"] = true;
                validationType["skip-target-difficulty-validation"] = true;
                validationType["skip-calculating-proofs"] = true;
                validationType["skip-calculating-block-nipopow-level"] = true;
                validationType["skip-saving-light-accountant-tree-serializations"] = true;

                if (Math.random() > 0.0001)
                    validationType["skip-validation-PoW-hash"] = true;

            }

        }


        return validationType;

    }

    async loadBlockchain( indexStartLoadingOffset = undefined, indexStartProcessingOffset = undefined ){

        if (process.env.BROWSER)
            return true;

        let numBlocks = 0;

        try {
            //load the number of blocks
            numBlocks = await this.db.get(this._blockchainFileName);
            if (numBlocks === null) {
                console.error("numBlocks was not found");
                return false;
            }

        } catch (exception){

            numBlocks = 0;

        }

        this.blocks.clear();

        try {

            let indexStart = 0;

            if (indexStartLoadingOffset )
                indexStart = numBlocks - indexStartLoadingOffset;

            if (indexStartProcessingOffset !== undefined) {
                indexStartProcessingOffset = numBlocks - indexStartProcessingOffset;

                console.warn("===========================================================");
                console.warn("Fast Blockchain Loading");
                console.warn("Blocks Processing starts at: ", indexStartProcessingOffset);
                console.warn("===========================================================");

            }

            this.blocks.length = indexStart || 0; // marking the first blocks as undefined

            let index = 0;

            try {

                for (index = indexStart; index < numBlocks; ++index ) {

                    let validationType = this._getLoadBlockchainValidationType(indexStart, index, numBlocks, indexStartProcessingOffset );

                    let blockValidation = new InterfaceBlockchainBlockValidation(  this.getBlock.bind(this), this.getDifficultyTarget.bind(this), this.getTimeStamp.bind(this), this.getHashPrev.bind(this), validationType );

                    let block = await this._loadBlock(indexStart, index, blockValidation);

                    block.blockValidation.blockValidationType = {};

                }

            } catch (exception){
                console.error("Error loading block", index);

                if ( this.blocks.length < 10)
                    return false;

                if (indexStartProcessingOffset !== undefined && index < indexStartProcessingOffset){
                    return false;
                }

            }

        } catch (exception){

            if (this.accountantTree !== undefined)
                console.log("serializeMiniAccountantTreeERRROR", this.accountantTree.serializeMiniAccountant().toString("hex"));

            console.log("serializeMiniAccountantTreeERRROR", this.blocks.length-1);
            console.error("blockchain.load raised an exception", exception);

            return false;
        }

        return true;
    }


    async _loadBlock(indexStart, i, blockValidation){

        let revertActions = new RevertActions(this);

        revertActions.push( { name: "breakpoint" } );

        let block = this.blockCreator.createEmptyBlock(i, blockValidation);
        block.height = i;

        try{

            if (await block.loadBlock() === false)
                throw {message: "no block to load was found"};

            //it will include the block, but it will not ask to save, because it was already saved before

            if (await this.includeBlockchainBlock( block, undefined, "all", false, revertActions) ) {

                if (i % 100 === 0)
                    console.warn("blockchain loaded successfully index ", i);

            }
            else {
                console.error("blockchain is invalid at index " + i);
                throw {message: "blockchain is invalid at index ", height: i};
            }


        } catch (exception){
            console.error("blockchain LOADING stopped at " + i, exception);
            revertActions.revertOperations();
            revertActions.destroyRevertActions();

            throw exception;
        }

        revertActions.destroyRevertActions();
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

        this.blocks.spliceBlocks(index, true);

        return true;
    }

    createBlockValidation(){
        return new InterfaceBlockchainBlockValidation( this.getBlock.bind(this), this.getDifficultyTarget.bind(this), this.getTimeStamp.bind(this), this.getHashPrev.bind(this), {} );
    }


}

export default InterfaceBlockchain;