import NodeProtocol from 'common/sockets/protocol/node-protocol';

import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/interface-blockchain/blocks/Blockchain-Genesis'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'
import InterfaceBlockchainDifficulty from 'common/blockchain/interface-blockchain/mining/difficulty/Interface-Blockchain-Difficulty'

import InterfaceBlockchainForksAdministrator from './forks/Interface-Blockchain-Forks-Administrator'

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchain {


    constructor (){

        this.blocks = [];
        this.forksAdministrator = new InterfaceBlockchainForksAdministrator(this);

        this.blockCreator = new InterfaceBlockchainBlockCreator( this )

        this.mining = undefined;
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
    async includeBlockchainBlock(block, resetMining){

        if (! await this.validateBlockchainBlock(block) ) return false; // the block has height === this.blocks.length

        //let's check again the heights
        if (block.height !== this.blocks.length) throw ('heights of a new block is not good... strange');a

        this.blocks.push(block);

        NodeProtocol.broadcastRequest( "blockchain/header/new-block", { height: block.height, prevHash: block.hashPrev, hash: block.hash, chainLength: this.blocks.length });

        if (resetMining && this.mining !== undefined){
            //reset mining
            this.mining.reset();
        }

        return true;
    }

    async validateBlockchainBlock( block, prevDifficultyTarget, prevHash, prevTimeStamp ){

        if ( block instanceof InterfaceBlockchainBlock === false ) throw ('block '+height+' is not an instance of InterfaceBlockchainBlock ');

        // in case it is not a fork controlled blockchain
        if (prevDifficultyTarget === undefined){

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

    toString(){

    }

    toJSON(){

    }

    save(){

    }

    load(){

    }

}

export default InterfaceBlockchain;