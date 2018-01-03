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

import Serialization from "common/utils/Serialization.js";
import BufferExtended from "common/utils/BufferExtended.js";
import consts from 'consts/const_global'

const colors = require('colors/safe');

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchain {


    constructor (){

        this.blocks = [];
        this._blocksSempahore = false;

        this.mining = undefined;

        this.transactions = new InterfaceBlockchainTransactions();
        
        this.db = new InterfaceSatoshminDB();

        this.forksAdministrator = new InterfaceBlockchainForksAdministrator ( this );
        this.blockCreator = new InterfaceBlockchainBlockCreator( this, this.db, InterfaceBlockchainBlock, InterfaceBlockchainBlockData);
        
        this.blockchainFileName = 'blockchain.bin';
    }

    async validateBlockchain(){

        for (let i=0; i<this.blocks.length; i++){
            if (! await this.validateBlockchainBlock(this.blocks[i]) ) return false;
        }

        return true;
    }

    simulateNewBlock(block, revertAutomatically, callback){

    }

    /**
     * Include a new block at the end of the blockchain, by validating the next block
        Will save the block in the blockchain, if it is valid
     * @param block
     * @param resetMining
     * @param socketsAvoidBroadcast
     * @returns {Promise.<boolean>}
     */
    async includeBlockchainBlock(block, resetMining, socketsAvoidBroadcast){

        if (block.reward === undefined)
            block.reward = BlockchainMiningReward.getReward(block.height);

        if (this.transactions.uniqueness.searchTransactionsUniqueness(block.data.transactions))
            throw "transaction already processed";

        if (! await this.validateBlockchainBlock(block) ) return false; // the block has height === this.blocks.length

        //let's check again the heights
        if (block.height !== this.blocks.length) throw ('height of a new block is not good... '+ block.height + " "+ this.blocks.length);

        this.blocks.push(block);

        // broadcasting the new block, to everybody else
        NodeProtocol.broadcastRequest( "blockchain/header/new-block", {
            height: block.height,
            chainLength: this.blocks.length,
            header:{
                hash: block.hash,
                hashPrev: block.hashPrev,
                data: {
                    hashData: block.data.hashData,
                    hashAccountantTree: block.data.hashAccountantTree,
                },
                nonce: block.nonce,

            }
        }, "all", socketsAvoidBroadcast);

        if (resetMining && this.mining !== undefined  && this.mining !== null) //reset mining
            this.mining.resetMining();

        return true;
    }

    async validateBlockchainBlock( block, prevDifficultyTarget, prevHash, prevTimeStamp, validationType ){

        validationType = validationType || "normal";

        if ( block instanceof InterfaceBlockchainBlock === false ) throw ('block '+height+' is not an instance of InterfaceBlockchainBlock ');

        // in case it is not a fork controlled blockchain
        if (prevDifficultyTarget === undefined && prevHash === undefined && prevTimeStamp === undefined){

            prevDifficultyTarget = this.getDifficultyTarget();

            if (block.height === 0 ) {
                //validate genesis
                BlockchainGenesis.validateGenesis(block);

                prevHash = BlockchainGenesis.hashPrev;
                prevTimeStamp = BlockchainGenesis.timeStamp;
            } else {

                prevHash = this.blocks[block.height-1].hash;
                prevTimeStamp = this.blocks[block.height-1].timeStamp;
            }

        }

        //validate difficulty & hash
        if (await block.validateBlock(block.height, prevDifficultyTarget, prevHash, validationType) === false) throw ('block validation failed');

        //recalculate next target difficulty
        block.difficultyTarget = BlockchainDifficulty.getDifficulty( prevDifficultyTarget, prevTimeStamp, block.timeStamp, block.height );

        return true;

    }

    getBlockchainLength(){
        return this.blocks.length;
    }

    getBlockchainLastBlock(){
        return this.blocks[this.blocks.length-1];
    }

    getDifficultyTarget(){
        if (this.blocks.length > 0)
            return this.blocks[this.blocks.length-1].difficultyTarget;
        else
            return BlockchainGenesis.difficultyTarget;
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

    async save(){      

        //save the number of blocks
        let response = await this.db.save(this.blockchainFileName, this.blocks.length);

        if (response !== true){
            return false;
        }

        for (let i = 0; i < this.blocks.length; ++i){
            let response = await this.blocks[i].save();

            if (response !== true)
                return response;
        }
        
        return true;
    }

    async load(){

        //load the number of blocks
        let numBlocks = await this.db.get(this.blockchainFileName);
        if (typeof numBlocks.status !== 'undefined') {
            return false;
        }
        
        this.blocks = [];

        try {
            for (let i = 0; i < numBlocks; ++i) {
                this.blocks[i] = new InterfaceBlockchainBlock(this, 0, new Buffer(consts.BLOCKS_POW_LENGTH), new Buffer(consts.BLOCKS_POW_LENGTH), undefined, undefined, undefined, i, this.db);
                let response = await this.blocks[i].load();

                if (response !== true) {

                    if (await this.includeBlockchainBlock(this.blocks[i]) === false)
                        console.log(colors.red("blockchain is invalid at index " + i));

                    return response;
                }
            }
        } catch (exception){
            console.log(colors.red("blockchain.load raised an exception"), exception);
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

}

export default InterfaceBlockchain;