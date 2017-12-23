import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import consts from 'consts/const_global'

import BlockchainGenesis from './Blockchain-Genesis'

class InterfaceBlockchainBlockData {

    constructor(minerAddress, transactions, hashData){

        if (minerAddress === undefined)
            minerAddress = BlockchainGenesis.address;

        this.minerAddress = minerAddress;
        this.transactions = transactions||[];

        if (hashData === undefined || hashData === null){
            hashData = this.computeHashBlockData();
        }

        this.hashData = hashData;

    }

    validateBlockData(){

        if (this.minerAddress === undefined || this.minerAddress === null  ) throw ('data.minerAddress is empty');

        if (this.hashData === undefined || this.hashData === null || !Buffer.isBuffer(this.hashData)) throw ('hashData is empty');

        //validate hash
        let hashData = this.computeHashBlockData();

        if (!hashData.equals(this.hashData)) throw "block.data hashData is not right";

        return true;
    }

    computeHashBlockData(){

        // sha256 (sha256 ( serialized ))

        return WebDollarCrypto.SHA256 ( WebDollarCrypto.SHA256( this.serializeData() )).buffer;
    }

    /**
     convert data to Buffer
     **/
    serializeData(){

        let buffer = Buffer.concat( [
            WebDollarCryptoData.createWebDollarCryptoData( this.minerAddress ).toFixedBuffer(consts.PUBLIC_ADDRESS_LENGTH)
        ] )
        return buffer;
    }

    deserializeData(buffer){

        let data = WebDollarCryptoData.createWebDollarCryptoData(buffer);

        let offset = 0;
        this.data = {};

        this.minerAddress = data.substr(offset, consts.PUBLIC_ADDRESS_LENGTH).buffer;
        offset += consts.PUBLIC_ADDRESS_LENGTH;

        return buffer;
    }

    toString(){

        return JSON.stringify(this.data)

    }

    toJSON(){
        return this.data;
    }


}

export default InterfaceBlockchainBlockData;