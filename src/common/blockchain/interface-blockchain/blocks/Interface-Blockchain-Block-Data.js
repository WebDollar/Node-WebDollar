import BufferExtended from "common/utils/BufferExtended"
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import consts from 'consts/const_global'
import Serialization from 'common/utils/Serialization'

import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import InterfaceBlockchainAddressHelper from "../addresses/Interface-Blockchain-Address-Helper";
import InterfaceBlockchainBlockDataTransactions from "./Interface-Blockchain-Block-Data-Transactions";


class InterfaceBlockchainBlockData {


    /**
        miner address is unencodedAddress
     **/

    constructor(blockchain, minerAddress, transactions, hashTransactions, hashData ){

        this.blockchain = blockchain;

        this._minerAddress = undefined;

        if (minerAddress === undefined)
            minerAddress = BlockchainGenesis.address;

        this.minerAddress = minerAddress;

        this.transactions = new InterfaceBlockchainBlockDataTransactions(this, transactions, hashTransactions);

        this.hashData = hashData;

        if (hashData === undefined || hashData === null)
            this.computeHashBlockData();

    }

    destroyBlockData(){

        this.blockchain = undefined;
        this._minerAddress = undefined;

        this.transactions.destroyBlockDataTransactions();
        this.transactions.blockData = undefined;
        this.transactions = undefined;

    }

    async validateBlockData(blockHeight, blockValidation){

        if (!Buffer.isBuffer(this.minerAddress) || this.minerAddress.length !==  consts.ADDRESSES.ADDRESS.LENGTH )
            throw {message: 'data.minerAddress is empty'};

        if (this.hashData === undefined || this.hashData === null || !Buffer.isBuffer(this.hashData))
            throw {message: 'hashData is empty'};

        //validate hash
        if (!blockValidation.blockValidationType["skip-block-data-validation"]) {

            let hashData = this.calculateHashBlockData();

            if (!BufferExtended.safeCompare(hashData, this.hashData))
                throw {message: "block.data hashData is not right"};
        }

        if (!blockValidation.blockValidationType["skip-block-data-transactions-validation"]) {

            if (await this.transactions.validateTransactions(blockHeight, blockValidation.blockValidationType) === false)
                throw {message: "transactions failed to validate"};

        }

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

        if ( !this.transactions.hashTransactions )
            this.transactions.hashTransactions = this.transactions.calculateHashTransactions();

        return Buffer.concat ([

            Serialization.serializeToFixedBuffer( consts.ADDRESSES.ADDRESS.LENGTH, this.minerAddress ),
            this.transactions.serializeTransactions(onlyHeader),

        ]);

    }

    /**
     convert data to Buffer
     **/
    serializeData(onlyHeader = false){

        if ( !Buffer.isBuffer(this.hashData) || this.hashData.length !== 32 )
            this.computeHashBlockData();

        return Buffer.concat( [
            Serialization.serializeToFixedBuffer( 32, this.hashData ),
            this._computeBlockDataHeaderPrefix(onlyHeader),
        ] )

    }

    deserializeData(buffer, offset, onlyHeader = false){

        this.hashData = BufferExtended.substr(buffer, offset, 32);
        offset += 32;

        this.minerAddress = BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH);
        offset += consts.ADDRESSES.ADDRESS.LENGTH;

        offset = this.transactions.deserializeTransactions(buffer, offset, onlyHeader);

        return offset;
    }


    toString(){

        return this.minerAddress.toString("hex") + this.hashData.toString("hex")

    }

    toJSON(){
        return {
            minerAddress: Buffer.isBuffer(this.minerAddress) ?  this.minerAddress.toString("hex") : '',
            hashData: Buffer.isBuffer(this.hashData) ?  this.hashData.toString("hex") : '',
        };
    }

    equals(data) {
        return BufferExtended.safeCompare(this.hashData, data.hashData);
    }

    get minerAddress(){
        return this._minerAddress;
    }

    set minerAddress(minerAddress){
        this._setMinerAddress(minerAddress);
    }

    _setMinerAddress(minerAddressWIF){

        if (!Buffer.isBuffer(minerAddressWIF))
            minerAddressWIF = BufferExtended.fromBase(minerAddressWIF);

        let result = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(minerAddressWIF);

        if (result === null)
            throw {message: "Miner address is not a valid WIF", address: minerAddressWIF};

        this._minerAddress = result;
    }
}

export default InterfaceBlockchainBlockData;