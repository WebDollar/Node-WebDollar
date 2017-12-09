import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'

class InterfaceBlockchain{


    constructor (){

        this.length = 0;
        this.blocks = [];

    }

    validateBlockchain(){


        for (let i=0; i<this.blocks.length; i++){

            if (this.blocks[i] instanceof InterfaceBlockchainBlock) throw ('block '+i+' is not an instance of InterfaceBlockchainBlock ');

            if (this.blocks.validateBlock() === false) return false;
        }

        return true;
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