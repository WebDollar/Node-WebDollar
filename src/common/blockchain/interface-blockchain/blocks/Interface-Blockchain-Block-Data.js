import BufferExtended from "common/utils/BufferExtended"
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import consts from 'consts/const_global'
import Serialization from 'common/utils/Serialization'

import BlockchainGenesis from './Blockchain-Genesis'

class InterfaceBlockchainBlockData {

    constructor(blockchain, minerAddress, transactions, hashData){

        this.blockchain = blockchain;

        if (minerAddress === undefined)
            minerAddress = BlockchainGenesis.address;


        if (!Buffer.isBuffer(minerAddress))
            minerAddress = Buffer.from(minerAddress);

        this.minerAddress = minerAddress;

        this.transactions = transactions||[];

        if (hashData === undefined || hashData === null)
            hashData = this.computeHashBlockData();

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
        return WebDollarCrypto.SHA256 ( WebDollarCrypto.SHA256( this.serializeData() ));

    }

    /**
     convert data to Buffer
     **/
    serializeData(){

        let buffer = Buffer.concat( [
            Serialization.serializeToFixedBuffer( consts.PUBLIC_ADDRESS_LENGTH, this.minerAddress ),
            Serialization.serializeToFixedBuffer( this.hashData, 32 ),
        ] )
        return buffer;
    }

    deserializeData(buffer){

        let data = buffer;

        let offset = 0;
        this.data = {};

        this.minerAddress = BufferExtended.substr(data, offset, consts.PUBLIC_ADDRESS_LENGTH);
        offset += consts.PUBLIC_ADDRESS_LENGTH;

        this.hashData = BufferExtended.substr(data, offset, 32);
        offset += 32;

        return offset;
    }

    toString(){

        return JSON.stringify(this.data)

    }

    toJSON(){
        return this.data;
    }


}

export default InterfaceBlockchainBlockData;