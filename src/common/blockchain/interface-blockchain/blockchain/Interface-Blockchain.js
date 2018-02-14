import NodeProtocol from 'common/sockets/protocol/node-protocol';

import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import InterfaceBlockchainBlockData from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Data'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'

import BlockchainDifficulty from 'common/blockchain/global/difficulty/Blockchain-Difficulty'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'

import InterfaceBlockchainForksAdministrator from './forks/Interface-Blockchain-Forks-Administrator'
import InterfaceBlockchainTipsAdministrator from './tips/Interface-Blockchain-Tips-Administrator'

import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'

import InterfaceBlockchainTransactions from 'common/blockchain/interface-blockchain/transactions/Interface-Blockchain-Transactions'

import consts from 'consts/const_global'
import global from "consts/global"

import Serialization from 'common/utils/Serialization';
import SemaphoreProcessing from "common/utils/Semaphore-Processing"

const colors = require('colors/safe');
const EventEmitter = require('events');

const SEMAPHORE_PROCESSING_INTERVAL = 10;

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchain {


    constructor (agent){

        this.emitter = new EventEmitter();

        this.agent = agent;

        this.blocks = [];

        this.mining = undefined;

        this._blockchainFileName = consts.BLOCKCHAIN_FILE_NAME;
        this.db = new InterfaceSatoshminDB(consts.BLOCKCHAIN_DIRECTORY_NAME);

        this.blocksStartingPoint = 0;

        this.transactions = new InterfaceBlockchainTransactions();

        this.forksAdministrator = new InterfaceBlockchainForksAdministrator ( this );
        this.tipsAdministrator = new InterfaceBlockchainTipsAdministrator( this );

        this.blockCreator = new InterfaceBlockchainBlockCreator( this, this.db, InterfaceBlockchainBlock, InterfaceBlockchainBlockData);

        this.semaphoreProcessing = new SemaphoreProcessing(SEMAPHORE_PROCESSING_INTERVAL);
    }

    _setAgent(newAgent){

        this.agent = newAgent;
        this.forksAdministrator.initialize(this);
        this.tipsAdministrator.initialize(this);
    }

    async validateBlockchain(){

        for (let i=0; i<this.blocks.length; i++){
            if (! (await this.validateBlockchainBlock(this.blocks[i])) ) return false;
        }

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
    async includeBlockchainBlock(block, resetMining, socketsAvoidBroadcast, saveBlock, blockValidationType){

        if (block.reward === undefined)
            block.reward = BlockchainMiningReward.getReward(block.height);

        if (saveBlock === undefined) saveBlock = true;

        if (this.transactions.uniqueness.searchTransactionsUniqueness(block.data.transactions))
            throw "transaction already processed";

        if (! (await this.validateBlockchainBlock(block, undefined, undefined, undefined, blockValidationType)) ) return false; // the block has height === this.blocks.length


        //let's check again the heights
        if (block.height !== this.blocks.length) throw ('height of a new block is not good... '+ block.height + " "+ this.blocks.length);

        this.addBlock(block);

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
    async validateBlockchainBlock( block, prevDifficultyTarget, prevHash, prevTimeStamp, blockValidationType ){

        if ( block instanceof InterfaceBlockchainBlock === false ) throw ('block '+height+' is not an instance of InterfaceBlockchainBlock ');

        // in case it is not a fork controlled blockchain
        if (prevDifficultyTarget === undefined && prevHash === undefined && prevTimeStamp === undefined){

            if (block.height === 0 ) {
                //validate genesis
                prevDifficultyTarget = BlockchainGenesis.difficultyTarget;
                BlockchainGenesis.validateGenesis(block);

                prevHash = BlockchainGenesis.hashPrev;
                prevTimeStamp = 0; //Genesis timezone is 0
            } else {

                prevDifficultyTarget = this.getDifficultyTarget(block.height);
                prevHash = this.getHashPrev(block.height);
                prevTimeStamp = this.getTimeStamp(block.height);
            }

        }


        block.difficultyTargetPrev = prevDifficultyTarget;

        //validate difficulty & hash
        if (! (await block.validateBlock(block.height, prevDifficultyTarget, prevHash, blockValidationType))) throw ('block validation failed');

        //recalculate next target difficulty
        // console.log("block.difficultyTarget", prevDifficultyTarget, prevTimeStamp, block.timeStamp, block.height);
        block.difficultyTarget = BlockchainDifficulty.getDifficulty( prevDifficultyTarget, prevTimeStamp, block.timeStamp, block.height );
        // console.log("block.difficultyTarget", block.difficultyTarget);

        block.difficultyTarget = Serialization.serializeToFixedBuffer(consts.BLOCKS_POW_LENGTH, Serialization.serializeBigInteger(block.difficultyTarget));

        // console.log(" computed ", block.difficultyTarget.toString("hex"), " from ", prevDifficultyTarget.toString("hex") )

        return true;

    }

    getBlockchainStartingPoint(){
        return this.blocksStartingPoint;
    }

    get getBlockchainLength(){
        return this.blocks.length;
    }

    get getBlockchainLastBlock(){
        return this.blocks[this.blocks.length-1];
    }

    getDifficultyTarget(height){

        if (height === undefined) height = this.blocks.length;

        if (height <= 0)  return BlockchainGenesis.difficultyTarget;
        else{
            if (height > this.blocks.length ) throw "getDifficultyTarget invalid height"; else
            if (this.blocks[height-1] === undefined) throw "getDifficultyTarget invalid height";

            return this.blocks[height-1].difficultyTarget;
        }

    }

    getTimeStamp(height){
        if (height === undefined) height = this.blocks.length;

        if (height <= 0)  return BlockchainGenesis.timeStamp;
        else{
            if (height > this.blocks.length ) throw "getTimeStamp invalid height"; else
            if (this.blocks[height-1] === undefined) throw "getTimeStamp invalid height";

            return this.blocks[height-1].timeStamp;
        }
    }

    getHashPrev(height){
        if (height === undefined) height = this.blocks.length;

        if (height <= 0)  return BlockchainGenesis.hashPrev;
        else {
            if (height > this.blocks.length ) throw "getHashPrev invalid height"; else
            if (this.blocks[height-1] === undefined) throw "getHashPrev invalid height";

            return this.blocks[height-1].hash;
        }
    }

    toString(){

    }

    toJSON(){

    }

    async saveNewBlock(block){

        if (await this.db.save(this._blockchainFileName, this.blocks.length) !== true){
            console.log(colors.red("Error saving the blocks.length"));
            return false;
        }

        await block.save();

        return true;
    }

    async save(onlyLastBlocks){

        //save the number of blocks
        let result = true;

        if (await this.db.save(this._blockchainFileName, this.blocks.length) !== true){
            console.log(colors.red("Error saving the blocks.length"));
        } else {

            let indexStart = 0;

            if (onlyLastBlocks !== undefined){
                indexStart = this.blocks.length - onlyLastBlocks;
            }


            for (let i = indexStart; i < this.blocks.length; ++i)

                if (this.blocks[i] !== undefined && this.blocks[i] !== null) {
                    let response = await this.blocks[i].save();

                    if (response !== true)
                        break;
                }
        }

        return result;
    }

    async load(onlyLastBlocks = undefined){

        //load the number of blocks
        let numBlocks = await this.db.get(this._blockchainFileName);
        if (numBlocks === null ) {
            console.log(colors.red("numBlocks was not found"));
            return false;
        }

        console.log(colors.yellow("validateLastBlocks", numBlocks))
        console.log(colors.yellow("validateLastBlocks", numBlocks))
        console.log(colors.yellow("validateLastBlocks", numBlocks))
        console.log(colors.yellow("validateLastBlocks", numBlocks))

        this.blocks = [];

        try {

            let blockValidationType = {};

            if (onlyLastBlocks !== undefined)
                blockValidationType["skip-validation-before"] = {height: numBlocks - onlyLastBlocks -1};

            let indexStart = 0;

            if (this.agent !== undefined && this.agent.light === true) {

                indexStart = Math.max(0, numBlocks - onlyLastBlocks-1);

                for (let i=0; i<indexStart; i++)
                    this.addBlock(undefined);
            }

            for (let i = indexStart; i < numBlocks; ++i) {

                let block = this.blockCreator.createEmptyBlock(i);
                block.height = i;

                try{

                    if (await block.load() === false) throw "no block to load was found";

                    //it will include the block, but it will not ask to save, because it was already saved before

                    if (await this.includeBlockchainBlock(block, undefined, "all", false, blockValidationType) ) {
                        console.log(colors.green("blockchain loaded successfully index ", i));
                    }
                    else {
                        console.log(colors.red("blockchain is invalid at index " + i));
                        throw "blockchain is invalid at index "+i;
                    }


                } catch (exception){
                    console.log(colors.red("blockchain LOADING stopped at " + i), exception);
                    throw exception;
                }

            }

        } catch (exception){
            console.log(colors.red("blockchain.load raised an exception"), exception);
            return false;
        }

        return true;
    }

    async remove(index, removeFiles = true){

        if (removeFiles === true) {
            for (let i = index; i < this.blocks.length; ++i){
                let response = await this.blocks[i].remove();

                if (response !== true)
                    return response;
            }
        }

        this.spliceBlocks(index);

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
            for (let i=Math.max(0, height); i<this.blocks.length; i++) {
                console.log("PROPAGATE " ,height, " sockets", socketsAvoidBroadcast.length);

                if (this.blocks[i] === undefined)
                    console.log(colors.red("PROPAGATE ERROR"+i), this.blocks[i]);
                else {
                    console.log("PROPAGATING", this.blocks[i].hash.toString("hex"));
                    this.agent.protocol.propagateHeader(this.blocks[i], this.blocks.length, socketsAvoidBroadcast);
                }
            }

        }
    }

    addBlock(block){

        this.blocks.push(block);

        this.emitter.emit("blockchain/blocks-count-changed", this.blocks.length);
        this.emitter.emit("blockchain/block-inserted", block);
    }

    spliceBlocks(after){
        this.blocks.splice(after);
        this.emitter.emit("blockchain/blocks-count-changed", this.blocks.length);
    }

}

export default InterfaceBlockchain;