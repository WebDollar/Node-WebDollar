import BufferExtended from "common/utils/BufferExtended"
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import consts from 'consts/const_global'
import Serialization from 'common/utils/Serialization'

import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import InterfaceBlockchainAddressHelper from "../addresses/Interface-Blockchain-Address-Helper";

class InterfaceBlockchainBlockData {

    constructor(blockchain, minerAddress, transactions, hashTransactions, hashData){

        this.blockchain = blockchain;

        if (minerAddress === undefined)
            minerAddress = BlockchainGenesis.address;

        this.setMinerAddress(minerAddress);

        this.transactions = transactions||[];

        if (hashTransactions === undefined)
            hashTransactions = this.calculateHashTransactions();

        this.hashTransactions = hashTransactions;

        this.hashData = hashData;

        if (hashData === undefined || hashData === null)
            this.calculateHashBlockData();

    }

    validateBlockData(){

        if (this.minerAddress === undefined || this.minerAddress === null || !Buffer.isBuffer(this.minerAddress)  ) throw ('data.minerAddress is empty');

        if (this.hashData === undefined || this.hashData === null || !Buffer.isBuffer(this.hashData)) throw ('hashData is empty');

        //validate hash
        let hashData = this.calculateHashBlockData();

        if (!hashData.equals(this.hashData)) throw "block.data hashData is not right";

        return true;
    }

    computeHashBlockData(){
        this.hashData = this.calculateHashBlockData();
    }

    calculateHashBlockData(){
        // sha256 (sha256 ( serialized ))
        return WebDollarCrypto.SHA256 ( WebDollarCrypto.SHA256( this._computeBlockDataHeaderPrefix() ));
    }

    calculateHashTransactions (){
        return WebDollarCrypto.SHA256 ( WebDollarCrypto.SHA256( this._computeBlockDataTransactionsConcatenate() ));
    }

    _computeBlockDataTransactionsConcatenate(){

        let bufferList = [];

        for (let i=0; i<this.transactions.length; i++)
            bufferList.push( this.transactions[i].serializeTransaction() );

        return Buffer.concat( bufferList )

    }

    _computeBlockDataHeaderPrefix(){

        return Buffer.concat ( [
            Serialization.serializeToFixedBuffer( consts.PUBLIC_ADDRESS_LENGTH, this.minerAddress ),
            Serialization.serializeToFixedBuffer( 32, this.hashTransactions ),
        ]);

    }

    /**
     convert data to Buffer
     **/
    serializeData(){

        if (!Buffer.isBuffer(this.hashData) || this.hashData.length !== 32)
            this.computeHashBlockData();

        return Buffer.concat( [
            Serialization.serializeToFixedBuffer( 32, this.hashData ),
            this._computeBlockDataHeaderPrefix(),
        ] )

    }

    deserializeData(buffer, offset){

        this.data = {};

        this.minerAddress = BufferExtended.substr(buffer, offset, consts.PUBLIC_ADDRESS_LENGTH );
        offset += consts.PUBLIC_ADDRESS_LENGTH;

        this.hashData = BufferExtended.substr(buffer, offset, 32);
        offset += 32;

        return offset;
    }

    toString(){

        return this.minerAddress.toString("hex") + this.hashData.toString("hex")

    }

    toJSON(){
        return {
            minerAddress:this.minerAddress,
            hashData: this.hashData.toString("hex"),
        };
    }

    equals(data) {
        return this.hashData.equals(data.hashData);
    }

    setMinerAddress(minerAddressWIF){

        if (!Buffer.isBuffer(minerAddressWIF))
            minerAddressWIF = BufferExtended.fromBase(minerAddressWIF);

        let result = InterfaceBlockchainAddressHelper.validateAddressChecksum(minerAddressWIF);

        if (result === null)
            throw 'Miner address is not a valid WIF';

        this.minerAddress = result;

    }
}

export default InterfaceBlockchainBlockData;