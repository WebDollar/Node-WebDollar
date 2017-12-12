import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/interface-blockchain/blocks/Blockchain-Genesis'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'

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

    validateBlockchainBlock(block, index){

        if (this.blocks[i] instanceof InterfaceBlockchainBlock) throw ('block '+index+' is not an instance of InterfaceBlockchainBlock ');

        if (this.blocks.validateBlock(index) === false) return false;

        //validate genesis
        if (index === 0 )
            BlockchainGenesis.validateGenesis(block)

    }

    getBlockchainLength(){
        return this.blocks.length;
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