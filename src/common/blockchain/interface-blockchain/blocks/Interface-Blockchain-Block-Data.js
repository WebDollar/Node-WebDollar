import BufferExtended from "common/utils/BufferExtended"
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import consts from 'consts/const_global'
import Serialization from 'common/utils/Serialization'

import BlockchainGenesis from './Blockchain-Genesis'

class InterfaceBlockchainBlockData {

    constructor(minerAddress, transactions, hashData){

        if (minerAddress === undefined)
            minerAddress = BlockchainGenesis.address;


        if (!Buffer.isBuffer(minerAddress))
            minerAddress = Buffer.from(minerAddress);

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
            Serialization.serializeToFixedBuffer( consts.PUBLIC_ADDRESS_LENGTH, this.minerAddress )
        ] )
        return buffer;
    }

    deserializeData(buffer){

        let data = buffer;

        let offset = 0;
        this.data = {};

        this.minerAddress = BufferExtended.substr(data, offset, consts.PUBLIC_ADDRESS_LENGTH).buffer;
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