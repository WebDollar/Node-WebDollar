import NodeProtocol from 'common/sockets/protocol/node-protocol';

import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/interface-blockchain/blocks/Blockchain-Genesis'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'
import InterfaceBlockchainDifficulty from 'common/blockchain/interface-blockchain/mining/difficulty/Interface-Blockchain-Difficulty'

import InterfaceBlockchainForksAdministrator from './forks/Interface-Blockchain-Forks-Administrator'

import InterfacePouchDB from 'common/pouchdb/Interface-PouchDB'

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchain {


    constructor (){

        this.blocks = [];
        this._blocksSempahore = false;

        this.forksAdministrator = new InterfaceBlockchainForksAdministrator(this);

        this.blockCreator = new InterfaceBlockchainBlockCreator( this )

        this.mining = undefined;
        
        this.dataBase = new InterfacePouchDB();
    }

    async validateBlockchain(){

        for (let i=0; i<this.blocks.length; i++){
            if (! await this.validateBlockchainBlock(this.blocks[i]) ) return false;
        }

        return true;
    }

    /*
        Include a new block at the end of the blockchain, by validating the next block
     */
    async includeBlockchainBlock(block, resetMining, socketsAvoidBroadcast){


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
                hashData: block.hashData,
                nonce: block.nonce,

            }
        }, "all", socketsAvoidBroadcast);

        if (resetMining && this.mining !== undefined  && this.mining !== null) //reset mining
            this.mining.resetMining();

        return true;
    }

    async validateBlockchainBlock( block, prevDifficultyTarget, prevHash, prevTimeStamp ){

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
        if (await block.validateBlock(block.height, prevDifficultyTarget, prevHash) === false) throw ('block validation failed')

        //recalculate next target difficulty
        block.difficultyTarget = InterfaceBlockchainDifficulty.getDifficulty( prevDifficultyTarget, prevTimeStamp, block.timeStamp, block.height );

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
        for (let i = 0; i < this.blocks.length; ++i){
            await this.blocks[i].save();
        }
    }

    async load(){
        for (let i = 0; i < this.blocks.length; ++i){
            await this.blocks[i].load();
        }
    }
    
    async remove(index, removeFiles = true){
        
        if (removeFiles === true) {
            for (let i = index; i < this.blocks.length; ++i){
                await this.blocks[i].remove();
            }
        }
        
        this.blocks.splice(index);
    }

}

export default InterfaceBlockchain;