import BufferExtended from "common/utils/BufferExtended"
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import consts from 'consts/const_global'
import Serialization from 'common/utils/Serialization'

import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import InterfaceBlockchainAddressHelper from "../addresses/Interface-Blockchain-Address-Helper";
import InterfaceBlockchainBlockDataTransactions from "./Interface-Blockchain-Block-Data-Transactions";

class InterfaceBlockchainBlockData {

    constructor(blockchain, minerAddress, transactions, hashTransactions, hashData){

        this.blockchain = blockchain;

        this._onlyHeader = false;

        if (minerAddress === undefined)
            minerAddress = BlockchainGenesis.address;

        this.setMinerAddress(minerAddress);

        this.transactions = new InterfaceBlockchainBlockDataTransactions(this, transactions, hashTransactions);

        this.hashData = hashData;

        if (hashData === undefined || hashData === null)
            this.computeHashBlockData();

    }

    validateBlockData(blockHeight, blockValidation){

        if (this.minerAddress === undefined || this.minerAddress === null || !Buffer.isBuffer(this.minerAddress)  )
            throw {message: 'data.minerAddress is empty'};

        if (this.hashData === undefined || this.hashData === null || !Buffer.isBuffer(this.hashData))
            throw {message: 'hashData is empty'};

        //validate hash
        let hashData = this.calculateHashBlockData();

        if (!hashData.equals(this.hashData))
            throw {message: "block.data hashData is not right"}

        if (!this.transactions.validateTransactions(blockHeight, blockValidation))
            throw {message: "transactions failed to validate"}

        return true;
    }

    computeHashBlockData(){
        this.hashData = this.calculateHashBlockData();
    }

    calculateHashBlockData(){
        // sha256 (sha256 ( serialized ))
        return WebDollarCrypto.SHA256 ( WebDollarCrypto.SHA256( this._computeBlockDataHeaderPrefix(true) ));
    }

    _computeBlockDataHeaderPrefix(onlyHeader = false){

        if (this.transactions.hashTransactions === undefined || this.transactions.hashTransactions === null)
            this.transactions.hashTransactions = this.transactions.calculateHashTransactions();

        return Buffer.concat ( [
            Serialization.serializeToFixedBuffer( consts.ADDRESSES.ADDRESS.WIF.LENGTH, this.minerAddress ),
            this.transactions.serializeTransactions(onlyHeader),
        ]);

    }

    /**
     convert data to Buffer
     **/
    serializeData(onlyHeader = false){

        if (!Buffer.isBuffer(this.hashData) || this.hashData.length !== 32)
            this.computeHashBlockData();

        return Buffer.concat( [
            Serialization.serializeToFixedBuffer( 32, this.hashData ),
            this._computeBlockDataHeaderPrefix(onlyHeader),
        ] )

    }

    deserializeData(buffer, offset, onlyHeader = false){

        this.hashData = BufferExtended.substr(buffer, offset, 32);
        offset += 32;

        this.minerAddress = BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.WIF.LENGTH );
        offset += consts.ADDRESSES.ADDRESS.WIF.LENGTH;

        offset = this.transactions.deserializeTransactions(buffer, offset, onlyHeader);

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
            throw {message: "Miner address is not a valid WIF", address: minerAddressWIF};

        this.minerAddress = result;

    }
}

export default InterfaceBlockchainBlockData;