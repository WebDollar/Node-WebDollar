/* eslint-disable */
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'

import consts from 'consts/const_global'
import global from "consts/global"

import Serialization from 'common/utils/Serialization';

import InterfaceBlockchainBlockValidation from "common/blockchain/interface-blockchain/blocks/validation/Interface-Blockchain-Block-Validation"

import RevertActions from "common/utils/Revert-Actions/Revert-Actions";

import InterfaceBlockchainBasic from "./Interface-Blockchain-Basic"
import InterfaceBlockchainHardForks from "./../blocks/hard-forks/Interface-Blockchain-Hard-Forks"
import Log from 'common/utils/logging/Log';
/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */

class InterfaceBlockchain extends InterfaceBlockchainBasic{

    constructor (agent){

        super(agent);

        this.hardForks = new InterfaceBlockchainHardForks(this);

    }

    async validateBlockchain(){

        for (let i = this.blocks.blocksStartingPoint; i < this.blocks.length; i++) {

            let block = await this.blocks.getBlock( i );
            if ( await this.validateBlockchainBlock( block ) === false )
                return false;
        }

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
            block.blockValidation.getHashCallback = this.getHash.bind(this);
            block.blockValidation.getChainHashCallback = this.getChainHash.bind(this);

        }

        if (! (await this.validateBlockchainBlock(block)) ) // the block has height === this.blocks.length
            return false;

        //let's check again the heights
        if (block.height !== this.blocks.length)
            throw {message: 'height of a new block is not good... ', height: block.height, blocksLength: this.blocks.length};

        //hard fork
        if ( !block.blockValidation.blockValidationType['skip-accountant-tree-validation'] && block.height === consts.BLOCKCHAIN.HARD_FORKS.WALLET_RECOVERY-1 )
            await this.hardForks.revertAllTransactions("WEBD$gC9h7iFUURqhGUL23U@7Ccyb@X$2BCCpSH$", 150940, revertActions, 18674877890000, "WEBD$gDZwjjD7ZE5+AE+44ITr8yo5E2aXYT3mEH$");

        await this._blockIncluded( block);

        await this.blocks.addBlock(block, revertActions, saveBlock, showUpdate, socketsAvoidBroadcast);

        await this._onBlockCreated(block,  saveBlock);

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

        if (block.height === 0 )
            BlockchainGenesis.validateGenesis(block);

        if ( !block.blockValidation )
            block.blockValidation = this.createBlockValidation();

        //validate difficulty & hash
        if (! (await block.validateBlock( block.height )))
            throw {message: 'block validation failed'};

        //recalculate next target difficulty
        if ( !block.blockValidation.blockValidationType['skip-difficulty-recalculation'] )
            await block.calculateDifficultyTarget();

        return true;
    }

    async getBlock(height = this.blocks.length-1){

        if (height ===  -1) return BlockchainGenesis;

        if (height >= this.blocks.length ) throw {message: "getBlock invalid height ", height:height, blocksLength: this.blocks.length};

        let block = await this.blocks.loadingManager.getBlock(height);

        if ( !block ) throw {message:"getBlock invalid data height", height:height, blocksLength: this.blocks.length};

        return block;

    }

    async getBlockByHash(sHash) {
        try {
            const nBlockNumber = await this.blocks.db.get('blockHashInversed' + sHash);

            if (typeof nBlockNumber === 'number') {
                return await this.getBlock(nBlockNumber);
            }

            return null;

        }
        catch (e) {
            return null;
        }
    }

    async getDifficultyTarget(height = this.blocks.length-1, POSRecalculation = true){

        if (height === -1) return BlockchainGenesis.difficultyTarget;
        if ( height === consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION-1) return BlockchainGenesis.difficultyTargetPOS;

        if (POSRecalculation && height >= consts.BLOCKCHAIN.HARD_FORKS.POS_ACTIVATION-1){

            if (height % 30 === 29 ) height = height - 10;  //first POS, get the last proof of Stake
            else if (height % 30 === 19 ) height = height - 20; //first POW, get the last proof of Work

        }

        if (height >= this.blocks.length ) throw {message: "getDifficultyTarget invalid height ", height:height, blocksLength: this.blocks.length};

        let difficulty = await this.blocks.loadingManager.getBlockDifficulty(height);

        if ( !difficulty )
            throw {message:"getDifficultyTarget invalid", height:height, blocksLength: this.blocks.length};

        return difficulty;

    }

    async getTimeStamp(height = this.blocks.length-1){

        if (height <= -1) return BlockchainGenesis.timeStamp;

        if (height >= this.blocks.length ) throw {message: "getTimeStamp invalid height ", height: height};

        let timeStamp = await this.blocks.loadingManager.getBlockTimestamp(height);
        if ( !timeStamp ) throw {message: "getTimeStamp invalid height ", height: height};

        return timeStamp;

    }

    async getHash(height = this.blocks.length-1){

        if (height  === -1) return BlockchainGenesis.hashPrev;

        if (height >= this.blocks.length ) throw {message: "getHash invalid height", height: height};

        let hash = await this.blocks.loadingManager.getBlockHash(height);
        if ( !hash ) throw {message: "getHash invalid height ", height: height};

        return hash;

    }

    async getChainHash(height = this.blocks.length-1){

        if (height === -1) return BlockchainGenesis.hash;

        if (height >= this.blocks.length )
            throw {message: "getChainHash invalid height", height: height};

        let chainHash = await this.blocks.loadingManager.getBlockChainHash(height);
        if ( !chainHash )
            throw {message: "getChainHash invalid height ", height: height};

        return chainHash;

    }

    async saveBlockchain(startingHeight = this.blocks.blocksStartingPoint, endingHeight = this.blocks.length){

        if (process.env.BROWSER)
            return true;

        global.INTERFACE_BLOCKCHAIN_SAVED = false;

        for (let i = startingHeight; i < endingHeight; i++ ) {

            let block  = await this.getBlock(i);
            if ( block )
                this.blocks.savingManager.addBlockToSave( block );

        }

        console.warn("Saving Blockchain. Starting from ", startingHeight, endingHeight);
        console.warn("Successfully saving blocks ", startingHeight, endingHeight);

        global.INTERFACE_BLOCKCHAIN_SAVED = true;

        return true;
    }

    async _loadBlockchain( startingPoint = 0, numBlocks){

        if (process.env.BROWSER)
            return true;

        if (!numBlocks) {
            numBlocks = await this.blocks.loadingManager.readBlockchainLength();
            await this.blocks.clearBlocks();
            this.accountantTree.clear();
        }

        global.INTERFACE_BLOCKCHAIN_LOADING = true;

        let answer = true;

        let revertActions = new RevertActions(this);

        try {

            let index;

            try {

                for ( index = startingPoint; index < numBlocks; ++index ) {

                    let block = await this._loadBlock( index, undefined, revertActions);

                    if (index > 0 && index % 50000 === 0)
                        await this.db.restart();

                    if (index > 0 && index % 10000 === 0)
                        await this.blocks.savingManager.saveBlockchain();

                }

                console.info("Loading Complete");

                await this.blocks.savingManager.saveBlockchain();

                await this.db.restart();

            } catch (exception){
                console.error("Error loading block", index, exception);

            }

        } catch (exception){

            if (this.accountantTree )
                Log.error("serializeMiniAccountantTreeERRROR", Log.LOG_TYPE.SAVING_MANAGER, this.accountantTree.serializeMiniAccountant().toString("hex"));

            Log.error("serializeMiniAccountantTreeERRROR", Log.LOG_TYPE.SAVING_MANAGER, this.blocks.length-1);
            Log.error("blockchain.load raised an exception", Log.LOG_TYPE.SAVING_MANAGER,exception);

            answer = false
        }

        global.INTERFACE_BLOCKCHAIN_LOADING = false;

        return answer;
    }


    async _loadBlock( index, blockValidation, revertActions ){

        if (!blockValidation)
            blockValidation = this.createBlockValidation();

        revertActions.push( { name: "breakpoint" } );

        let block = await this.blockCreator._createBlockNew( index, blockValidation, undefined, undefined, []);

        try{

            if (await block.loadBlock() === false)
                throw {message: "no block to load was found"};

            //it will include the block, but it will not ask to save, because it was already saved before

            if (await this.includeBlockchainBlock( block, undefined, "all", false, revertActions, false) ) {

                if ( index % 100 === 0)
                    console.warn("blockchain loaded successfully index ", index);

            }
            else {
                console.error("blockchain is invalid at index " + index);
                throw {message: "blockchain is invalid at index ", height: index};
            }

        } catch (exception){
            console.error("blockchain LOADING stopped at " + index, exception);
            await revertActions.revertOperations("breakpoint");

            throw exception;
        }

        //TODO should be disabled
        await block.saveBlockDifficulty();
        await block.saveBlockHash();
        await block.saveBlockHashInversed();
        await block.saveBlockChainHash();
        await block.saveBlockTimestamp();
        await block.saveChainWork();

        for (const transaction of block.data.transactions.transactions)
            await block.data.transactions.saveVirtualizedTxId(transaction.txId, block.height);


        return block;
    }

    async removeBlockchain( index ){

        await this.blocks.spliceBlocks(index, true);
        await this.blocks.saveBlockchainLength();

        return true;
    }

    createBlockValidation(){
        return new InterfaceBlockchainBlockValidation( this.getBlock.bind(this), this.getDifficultyTarget.bind(this), this.getTimeStamp.bind(this), this.getHash.bind(this), this.getChainHash.bind(this), {} );
    }


    /**
     * Save Blockchain when the application was terminated
     * @returns {Promise.<boolean>}
     */

    async saveBlockchainTerminated(){

        if (process.env.BROWSER)
            return true;

        await this.blocks.savingManager.saveAllBlocks();

    }


}

export default InterfaceBlockchain;
