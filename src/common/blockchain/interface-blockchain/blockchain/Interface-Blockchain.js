import NodeProtocol from 'common/sockets/protocol/node-protocol';

import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/interface-blockchain/blocks/Blockchain-Genesis'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'
import InterfaceBlockchainDifficulty from 'common/blockchain/interface-blockchain/mining/difficulty/Interface-Blockchain-Difficulty'
import InterfaceBlockchainFork from './Interface-Blockchain-Fork'

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchain {


    constructor (){

        this.blocks = [];
        this.forks = [];

        this.blockCreator = new InterfaceBlockchainBlockCreator( this )

    }

    async validateBlockchain(){

        for (let i=0; i<this.blocks.length; i++){

            if (! await this.validateBlockchainBlock(this.blocks[i], i) ) return false;


        }

        return true;
    }

    /*
        Include a new block at the end of the blockchain, by validating the next block
     */
    async includeBlockchainBlock(block){

        if (! await this.validateBlockchainBlock(block, this.blocks.length ) ) return false; // the block has height === this.blocks.length

        //let's check again the heights
        if (block.myHeight !== this.blocks.length) throw ('heights of a new block is not good... strange');a

        this.blocks.push(block);

        NodeProtocol.broadcastRequest( "blockchain/header/new-block", { height: block.myHeight, prevHash: block.hashPrev, hash: block.hash, chainLength: this.blocks.length });

        return true;
    }

    async validateBlockchainBlock(block, height){

        if ( block instanceof InterfaceBlockchainBlock === false ) throw ('block '+height+' is not an instance of InterfaceBlockchainBlock ');

        //validate genesis
        let previousDifficultyTarget = this.getDifficultyTarget(),
            previousHash, previousTimeStamp;


        if (height === 0 ) {
            BlockchainGenesis.validateGenesis(block)

            previousHash = BlockchainGenesis.hashPrev;
            previousTimeStamp = BlockchainGenesis.timeStamp;
        } else {

            previousHash = this.blocks[height-1].hash;
            previousTimeStamp = this.blocks[height-1].timeStamp;
        }

        //validate difficulty & hash
        if (await block.validateBlock(height, previousDifficultyTarget, previousHash) === false) throw ('block validation failed')

        //recalculate next target difficulty
        block.myDifficultyTarget = InterfaceBlockchainDifficulty.getDifficulty( previousDifficultyTarget, previousTimeStamp, block.timeStamp, block.myHeight );

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
            return this.blocks[this.blocks.length-1].myDifficultyTarget;
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