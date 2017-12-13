import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/interface-blockchain/blocks/Blockchain-Genesis'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'
import InterfaceBlockchainDifficulty from 'common/blockchain/interface-blockchain/mining/difficulty/Interface-Blockchain-Difficulty'
/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchain{


    constructor (){

        this.blocks = [];
        this.difficultyTarget = BlockchainGenesis.difficultyTarget;

        this.blockCreator = new InterfaceBlockchainBlockCreator( this )

    }

    validateBlockchain(){


        for (let i=0; i<this.blocks.length; i++){

            this.validateBlockchainBlock(this.blocks[i], i);

        }

        return true;
    }

    /*
        Include a new block at the end of the blockchain, by validating the next block
     */
    includeBlockchainBlock(block){

        let result =  this.validateBlockchainBlock(block, this.blocks.length ) ; // the block has index === this.blocks.length

        //let's check again the heights
        if (block.myHeight !== this.blocks.length) throw ('heights of a new block is not good... strange');

        //recalculate next target difficulty
        let prevBlock = this.blocks[block.myHeight-1];
        this.block = InterfaceBlockchainDifficulty.getDifficulty( prevBlock.myDifficultyTarget, prevBlock.timeStamp, block.timeStamp, block.myHeight);

        this.blocks.push(block)

    }

    validateBlockchainBlock(block, height){

        if (!block instanceof InterfaceBlockchainBlock) throw ('block '+height+' is not an instance of InterfaceBlockchainBlock ');

        //validate genesis
        let previousDifficultyTarget, previousHash;

        if (index === 0 ) {
            BlockchainGenesis.validateGenesis(block)

            previousDifficultyTarget= BlockchainGenesis.difficultyTarget;
            previousHash = BlockchainGenesis.hashPrev;
        } else {
            previousDifficultyTarget = this.blocks[height-1].myDifficultyTarget;
            previousHash = BlockchainGenesis.hashPrev
        }

        //validate difficulty & hash
        if (block.validateBlock(height, previousDifficultyTarget, previousHash) === false) throw ('block validation failed')

        return true;

    }

    getBlockchainLength(){
        return this.blocks.length;
    }

    getBlockchainLastBlock(){
        return this.blocks[this.blocks.length-1];
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