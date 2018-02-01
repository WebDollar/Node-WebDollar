import NodeProtocol from 'common/sockets/protocol/node-protocol';

import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import InterfaceBlockchainBlockData from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Data'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'

import BlockchainDifficulty from 'common/blockchain/global/difficulty/Blockchain-Difficulty'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'

import InterfaceBlockchainForksAdministrator from './forks/Interface-Blockchain-Forks-Administrator'

import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'

import InterfaceBlockchainTransactions from 'common/blockchain/interface-blockchain/transactions/Interface-Blockchain-Transactions'

import consts from 'consts/const_global'

const colors = require('colors/safe');
const EventEmitter = require('events');

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchain {


    constructor (agent){

        this.emitter = new EventEmitter();

        this.agent = agent;

        this.blocks = [];
        this._blocksSempahore = false;

        this.mining = undefined;

        this.transactions = new InterfaceBlockchainTransactions();

        this.db = new InterfaceSatoshminDB();

        this.forksAdministrator = new InterfaceBlockchainForksAdministrator ( this );
        this.blockCreator = new InterfaceBlockchainBlockCreator( this, this.db, InterfaceBlockchainBlock, InterfaceBlockchainBlockData);

        this.blockchainFileName = 'blockchain.bin';

        this.blocksStartingPoint = 0;
    }

    _setAgent(newAgent){

        this.agent = newAgent;
        this.forksAdministrator = new InterfaceBlockchainForksAdministrator ( this, newAgent.forkClass );
    }

    async validateBlockchain(){

        for (let i=0; i<this.blocks.length; i++){
            if (! await this.validateBlockchainBlock(this.blocks[i]) ) return false;
        }

        return true;
    }

    async simulateNewBlock(block, revertAutomatically, callback){
        await callback();
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

        if (! await this.validateBlockchainBlock(block, undefined, undefined, undefined, blockValidationType) ) return false; // the block has height === this.blocks.length


        //let's check again the heights
        if (block.height !== this.blocks.length) throw ('height of a new block is not good... '+ block.height + " "+ this.blocks.length);

        this.blocks.push(block);

        // if (block.height > 0)
        //     console.log("prevBlock", this.blocks[block.height-1]);
        //

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

    async validateBlockchainBlock( block, prevDifficultyTarget, prevHash, prevTimeStamp, blockValidationType ){

        if ( block instanceof InterfaceBlockchainBlock === false ) throw ('block '+height+' is not an instance of InterfaceBlockchainBlock ');

        // in case it is not a fork controlled blockchain
        if (prevDifficultyTarget === undefined && prevHash === undefined && prevTimeStamp === undefined){

            prevDifficultyTarget = this.getDifficultyTarget();

            if (block.height === 0 ) {
                //validate genesis
                BlockchainGenesis.validateGenesis(block);

                prevHash = BlockchainGenesis.hashPrev;
                prevTimeStamp = 0; //Cosmin Debug BlockchainGenesis.timeStamp;
            } else {

                prevHash = this.blocks[block.height-1].hash;
                prevTimeStamp = this.blocks[block.height-1].timeStamp;
            }

        }

        //validate difficulty & hash
        if (await block.validateBlock(block.height, prevDifficultyTarget, prevHash, blockValidationType) === false) throw ('block validation failed');

        //recalculate next target difficulty
        block.difficultyTarget = BlockchainDifficulty.getDifficulty( prevDifficultyTarget, prevTimeStamp, block.timeStamp, block.height );

        return true;

    }

    getBlockchainStartingPoint(){
        return this.blocksStartingPoint;
    }

    getBlockchainLength(){
        return this.blocks.length;
    }

    getBlockchainLastBlock(){
        return this.blocks[this.blocks.length-1];
    }

    getDifficultyTarget(height){

        if (height === undefined) height = this.blocks.length;

        if (height === 0)
            return BlockchainGenesis.difficultyTarget;
        else
            return this.blocks[height-1].difficultyTarget;
    }

    /**
     * Multiple Forks and Mining are asynchronously, and they can happen in the same time, changing the this.blocks
     * @param callback
     * @returns {Promise.<void>}
     */
    processBlocksSempahoreCallback(callback){

        return new Promise ((resolve) =>{

            let timer = setInterval( async () => {

                if ( this._blocksSempahore === false ){

                    this._blocksSempahore = true;
                    clearInterval(timer);

                    try {
                        let result = await callback();
                        this._blocksSempahore = false;
                        resolve(result);
                        return result;
                    } catch (exception){
                        this._blocksSempahore = false;
                        console.log("error processBlocksSempahoreCallback", exception);
                        throw exception;
                    }
                }
            },10);
        });

    }

    toString(){

    }

    toJSON(){

    }

    async saveNewBlock(block){

        if (await this.db.save(this.blockchainFileName, this.blocks.length) !== true){
            console.log(colors.red("Error saving the blocks.length"));
            return false;
        }

        await block.save();

        return true;
    }

    async save(){

        //save the number of blocks
        let result = false;

        if (await this.db.save(this.blockchainFileName, this.blocks.length) !== true){
            console.log(colors.red("Error saving the blocks.length"));
        } else

            for (let i = 0; i < this.blocks.length; ++i){
                let response = await this.blocks[i].save();

                if (response !== true) {
                    break;
                }
            }

        return result;
    }

    async load(validateLastBlocks){

        //load the number of blocks
        let numBlocks = await this.db.get(this.blockchainFileName);
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
            for (let i = 0; i < numBlocks; ++i) {

                let block = this.blockCreator.createEmptyBlock(i);
                block.height = i;

                let blockValidationType = {};

                if (validateLastBlocks !== undefined)
                    blockValidationType["skip-validation-before"] = {height: numBlocks - validateLastBlocks -1};

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

        this.blocks.splice(index);

        return true;
    }


    // aka head
    get last() {
        return this.blocks[this.blocks.length - 1];
    }

    // aka tail
    get first() {
        return this.blocks[this.blocks.length -1];
    }

    propagateBlocks(height, socketsAvoidBroadcast){

        if (this.agent !== undefined) {

            for (let i=height; i<this.blocks.length; i++)
                this.agent.protocol.propagateHeader(this.blocks[i], this.blocks.length, socketsAvoidBroadcast);
        }
    }

}

export default InterfaceBlockchain;