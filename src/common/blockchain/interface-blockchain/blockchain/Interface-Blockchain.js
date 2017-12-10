import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchain{


    constructor (){

        this.blocks = [];

    }

    validateBlockchain(){


        for (let i=0; i<this.blocks.length; i++){

            if (this.blocks[i] instanceof InterfaceBlockchainBlock) throw ('block '+i+' is not an instance of InterfaceBlockchainBlock ');

            if (this.blocks.validateBlock() === false) return false;
        }

        return true;
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