import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import InterfaceBlockchainGenesis from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Genesis'

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchain{


    constructor (){

        this.blocks = [];
        this.difficultyTarget = InterfaceBlockchainGenesis.difficultyTarget;

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
            InterfaceBlockchainGenesis.validateGenesis(block)

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