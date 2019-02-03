import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'

import consts from 'consts/const_global'
import global from "consts/global"

import Serialization from 'common/utils/Serialization';

import InterfaceBlockchainBlockValidation from "common/blockchain/interface-blockchain/blocks/validation/Interface-Blockchain-Block-Validation"

import RevertActions from "common/utils/Revert-Actions/Revert-Actions";
import NodeBlockchainPropagation from "common/sockets/protocol/propagation/Node-Blockchain-Propagation";

import InterfaceBlockchainBasic from "./Interface-Blockchain-Basic"
import InterfaceBlockchainHardForks from "./../blocks/hard-forks/Interface-Blockchain-Hard-Forks"
import Log from 'common/utils/logging/Log';
import InterfaceBlockchainFreeMemory from "./../free-memory/Interface-Blockchain-Free-Memory"
/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */

class InterfaceBlockchain extends InterfaceBlockchainBasic{

    constructor (agent){

        super(agent);

        this.hardForks = new InterfaceBlockchainHardForks(this);

        this.freeMemory = new InterfaceBlockchainFreeMemory(this);

    }

    async validateBlockchain(){

        for (let i = this.blocks.blocksStartingPoint; i < this.blocks.length; i++)
            if (! (await this.validateBlockchainBlock(this.blocks[i])) )
                return false;

        return true;
    }


    async simulateNewBlock(block, revertAutomatically, revertActions, callback, showUpdate = true ){
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
    async includeBlockchainBlock(block, resetMining, socketsAvoidBroadcast, saveBlock = true, revertActions, showUpdate){

        if (!block.reward ) block.reward = BlockchainMiningReward.getReward(block.height);

        if (!block.blockValidation )
            block.blockValidation = this.createBlockValidation();
        else {

            block.blockValidation.getBlockCallBack = this.getBlock.bind(this);
            block.blockValidation.getDifficultyCallback = this.getDifficultyTarget.bind(this);
            block.blockValidation.getTimeStampCallback = this.getTimeStamp.bind(this);
            block.blockValidation.getHashPrevCallback = this.getHashPrev.bind(this);

        }

        if (!block.blockValidation.blockValidationType['skip-sleep']) await this.sleep(2);

        if (! (await this.validateBlockchainBlock(block)) ) // the block has height === this.blocks.length
            return false;

        if (!block.blockValidation.blockValidationType['skip-sleep']) await this.sleep(2);

        //let's check again the heights
        if (block.height !== this.blocks.length)
            throw {message: 'height of a new block is not good... ', height: block.height, blocksLength: this.blocks.length};

        this.blocks.addBlock(block, revertActions, saveBlock, showUpdate);

        if (!block.blockValidation.blockValidationType['skip-sleep']) await this.sleep(2);

        //hard fork
        if ( !block.blockValidation.blockValidationType['skip-accountant-tree-validation'] && block.height === consts.BLOCKCHAIN.HARD_FORKS.WALLET_RECOVERY-1 )
            await this.hardForks.revertAllTransactions("WEBD$gC9h7iFUURqhGUL23U@7Ccyb@X$2BCCpSH$", 150940, revertActions, 18674877890000, "WEBD$gDZwjjD7ZE5+AE+44ITr8yo5E2aXYT3mEH$");


        await this._blockIncluded( block);

        if (!block.blockValidation.blockValidationType['skip-sleep']) await this.sleep(2);

        if (saveBlock) {

            this.savingManager.addBlockToSave(block);

            // propagating a new block in the network
            NodeBlockchainPropagation.propagateBlock( block, socketsAvoidBroadcast)
        }

        await this._onBlockCreated(block,  saveBlock);


        if (!block.blockValidation.blockValidationType['skip-sleep']) await this.sleep(2);

        if (resetMining && this.mining ) //reset mining
            this.mining.resetMining();

        return true;
    }

    /**
     * Event fired when a new Block has been inserted in the blockchain
     * @param block
     * @param saveBlock
     * @private
     */

    _onBlockCreated(block, saveBlock){

        if (!block.blockValidation.blockValidationType["skip-recalculating-hash-rate"] )
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


        //validate difficulty & hash
        if (! (await block.validateBlock( block.height )))
            throw {message: 'block validation failed'};

        //recalculate next target difficulty
        if ( !block.blockValidation.blockValidationType['skip-difficulty-recalculation'] ){

            //console.log("block.difficultyTarget", prevDifficultyTarget.toString("hex"), prevTimeStamp, block.timeStamp, block.height);

            block.difficultyTarget = block.blockValidation.getDifficulty( block.timeStamp, block.height );

            block.difficultyTarget = Serialization.convertBigNumber(block.difficultyTarget, consts.BLOCKCHAIN.BLOCKS_POW_LENGTH);

        }

        return true;
    }

    getBlock(height = this.blocks.length){

        if (height <= 0) return BlockchainGenesis;

        if (height > this.blocks.length ) throw {message: "getBlock invalid height ", height:height, blocksLength: this.blocks.length}; else
        if ( !this.blocks[height-1] ) throw {message:"getBlock invalid height", height:height, blocksLength: this.blocks.length};

        return this.blocks[height-1];

    }

    getDifficultyTarget(height = this.blocks.length, POSRecalculation = true){

        if (height <= 0) return BlockchainGenesis.difficultyTarget;

        if (POSRecalculation && height >= consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION){

            if (height % 30 === 0 && height === consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION) return BlockchainGenesis.difficultyTargetPOS;
            else if (height % 30 === 0 ) height = height - 10;  //first POS, get the last proof of Stake
            else if (height % 30 === 20 ) height = height - 20; //first POW, get the last proof of Work

        }

        if (height > this.blocks.length ) throw {message: "getDifficultyTarget invalid height ", height:height, blocksLength: this.blocks.length}; else
        if ( !this.blocks[height-1] ) throw {message:"getDifficultyTarget invalid height", height:height, blocksLength: this.blocks.length};

        return this.blocks[height-1].difficultyTarget;

    }

    getTimeStamp(height = this.blocks.length){

        if (height <= 0) return BlockchainGenesis.timeStamp;

        if (height > this.blocks.length ) throw {message: "getTimeStamp invalid height ", height: height}; else
        if ( !this.blocks[height-1] ) throw {message: "getTimeStamp invalid height ", height: height};

        return this.blocks[height-1].timeStamp;

    }

    getHashPrev(height = this.blocks.length){

        if (height <= 0)
            return BlockchainGenesis.hashPrev;
        else {

            if (height > this.blocks.length ) throw {message: "getHashPrev invalid height", height: height}; else
            if ( !this.blocks[height-1] ) throw {message: "getHashPrev invalid height", height: height};

            return this.blocks[height-1].hash;
        }
    }

    getChainHash(height = this.blocks.length){

        if (height <= 0)
            return BlockchainGenesis.hash;
        else {

            if (height > this.blocks.length ) throw {message: "getChainHash invalid height", height: height}; else
            if ( !this.blocks[height-1] ) throw {message: "getChainHash invalid height", height: height};

            return this.blocks[height-1].hashChain;
        }

    }

    async saveNewBlock(block, saveLength = false, saveInfinitum=false){

        if (process.env.BROWSER)
            return true;

        if (saveLength)
            if (await this.db.save(this._blockchainFileName, this.blocks.length, 20000, saveInfinitum ? 1000000 : 10) !== true){
                Log.error("Error saving the blocks.length", Log.LOG_TYPE.SAVING_MANAGER);
                return false;
            }

        await block.saveBlock();

        return true;
    }

    async saveBlockchain(startingHeight, endingHeight){

        if (process.env.BROWSER)
            return true;

        //save the number of blocks

        global.INTERFACE_BLOCKCHAIN_SAVED = false;

        if (startingHeight === undefined) startingHeight = this.blocks.blocksStartingPoint;
        if (endingHeight === undefined) endingHeight = this.blocks.length;

        for (let i = startingHeight; i < endingHeight; i++ )
            if (this.blocks[i] !== undefined && this.blocks[i] !== null)
                this.savingManager.addBlockToSave(this.blocks[i]);

        console.warn("Saving Blockchain. Starting from ", startingHeight, endingHeight);
        console.warn("Successfully saving blocks ", startingHeight, endingHeight);

        global.INTERFACE_BLOCKCHAIN_SAVED = true;

        return true;
    }



    _getLoadBlockchainValidationType(indexStart, i, numBlocks, indexStartProcessingOffset){

        let validationType = {"skip-sleep": true} ;

        if (indexStartProcessingOffset !== undefined ){

            //fast loading Blockchain
            if ( i <= indexStartProcessingOffset ){

                validationType["skip-prev-hash-validation"] = true;
                validationType["skip-accountant-tree-validation"] = true;
                validationType["skip-mini-blockchain-simulation"] = true;
                validationType["skip-validation-transactions-from-values"] = true;
                validationType["skip-validation-timestamp"] = true;
                validationType["skip-validation-timestamp-network-adjusted-time"] = true;
                validationType["skip-block-data-validation"] = true;
                validationType["skip-block-data-transactions-validation"] = true;
                validationType["skip-validation-interlinks"] = true;
                validationType["skip-validation"] = true;
                validationType["skip-interlinks-update"] = true;
                validationType["skip-target-difficulty-validation"] = true;
                validationType["skip-calculating-proofs"] = true;
                validationType["skip-calculating-block-nipopow-level"] = true;
                validationType["skip-saving-light-accountant-tree-serializations"] = true;
                validationType["skip-recalculating-hash-rate"] = true;

                if (Math.random() > 0.0001 || BlockchainGenesis.isPoSActivated( i ))
                    validationType["skip-validation-PoW-hash"] = true;

            }

        } else {

            if ( indexStart < numBlocks ){
                validationType["skip-recalculating-hash-rate"] = true;

                if ( i < numBlocks - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES_TO_DELETE )
                    validationType["skip-saving-light-accountant-tree-serializations"] = true;

                validationType["skip-calculating-proofs"] = true;

            }

        }


        return validationType;

    }

    async _loadBlockchain( indexStartLoadingOffset = undefined, indexStartProcessingOffset = undefined, numBlocks ){

        if (process.env.BROWSER)
            return true;

        if ( numBlocks === undefined)
            try {
                //load the number of blocks
                numBlocks = await this.db.get(this._blockchainFileName);
                if (numBlocks === null) {
                    Log.error("numBlocks was not found", Log.LOG_TYPE.SAVING_MANAGER);
                    return false;
                }

                Log.info("=======================", Log.LOG_TYPE.SAVING_MANAGER);
                Log.info("LOADING BLOCKS", numBlocks, Log.LOG_TYPE.SAVING_MANAGER);
                Log.info("=======================", Log.LOG_TYPE.SAVING_MANAGER);

            } catch (exception){

                numBlocks = 0;

            }

        this.blocks.clear();

        global.INTERFACE_BLOCKCHAIN_LOADING = true;

        let answer = true;

        try {

            let indexStart = 0;

            if (indexStartLoadingOffset !== undefined)
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

                //for POS it is required to have the transactions for the last 30 blocks
                let prevBlockFreedAlready = 0;

                for (index = indexStart; index < numBlocks; ++index ) {

                    let validationType = this._getLoadBlockchainValidationType(indexStart, index, numBlocks, indexStartProcessingOffset );

                    let blockValidation = new InterfaceBlockchainBlockValidation(  this.getBlock.bind(this), this.getDifficultyTarget.bind(this), this.getTimeStamp.bind(this), this.getHashPrev.bind(this), this.getChainHash.bind(this), validationType );

                    let block = await this._loadBlock(indexStart, index, blockValidation);

                    block.blockValidation.blockValidationType = {};


                    if ( index < consts.SETTINGS.FREE_TRANSACTIONS_FROM_MEMORY_MAX_NUMBER  ){

                        for (let j = prevBlockFreedAlready; j < index - consts.BLOCKCHAIN.POS.MINIMUM_POS_TRANSFERS - 1 ; j++)
                            this.blocks[j].data.transactions.freeTransactionsFromMemory();

                        prevBlockFreedAlready = Math.max( prevBlockFreedAlready, index - consts.BLOCKCHAIN.POS.MINIMUM_POS_TRANSFERS - 1 );

                    }

                    if (index > 0 && index % 10000 === 0) {
                        await this.db.restart();
                    }

                }

                await this.db.restart();

            } catch (exception){
                console.error("Error loading block", index);

                if ( this.blocks.length < 10)
                    answer = false;
                else
                if (indexStartProcessingOffset !== undefined)
                    answer = false;

            }

        } catch (exception){

            if (this.accountantTree !== undefined)
                Log.error("serializeMiniAccountantTreeERRROR", Log.LOG_TYPE.SAVING_MANAGER, this.accountantTree.serializeMiniAccountant().toString("hex"));

            Log.error("serializeMiniAccountantTreeERRROR", Log.LOG_TYPE.SAVING_MANAGER, this.blocks.length-1);
            Log.error("blockchain.load raised an exception", Log.LOG_TYPE.SAVING_MANAGER,exception);


            answer = false;
        }

        global.INTERFACE_BLOCKCHAIN_LOADING = false;

        return answer;
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

            if (await this.includeBlockchainBlock( block, undefined, "all", false, revertActions, false) ) {

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

        return new InterfaceBlockchainBlockValidation( this.getBlock.bind(this), this.getDifficultyTarget.bind(this), this.getTimeStamp.bind(this), this.getHashPrev.bind(this), this.getChainHash.bind(this), {} );

    }


    /**
     * Save Blockchain when the application was terminated
     * @returns {Promise.<boolean>}
     */

    async saveBlockchainTerminated(){

        if (process.env.BROWSER)
            return true;

        await this.savingManager.saveAllBlocks();

    }


}

export default InterfaceBlockchain;
