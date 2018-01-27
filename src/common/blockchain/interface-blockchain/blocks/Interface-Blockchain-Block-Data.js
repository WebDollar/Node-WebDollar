import BufferExtended from "common/utils/BufferExtended"
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import consts from 'consts/const_global'
import Serialization from 'common/utils/Serialization'

import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import InterfaceBlockchainAddressHelper from "../addresses/Interface-Blockchain-Address-Helper";
import InterfaceBlockchainTransaction from "../transactions/transaction/Interface-Blockchain-Transaction";

class InterfaceBlockchainBlockData {

    constructor(blockchain, minerAddress, transactions, hashTransactions, hashData){

        this.blockchain = blockchain;

        this._onlyHeader = false;

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
        return WebDollarCrypto.SHA256 ( WebDollarCrypto.SHA256( this._computeBlockDataHeaderPrefix(true) ));
    }

    calculateHashTransactions (){

        if (this._onlyHeader)
            return this.hashTransactions;
        else
            return WebDollarCrypto.SHA256 ( WebDollarCrypto.SHA256( this._computeBlockDataTransactionsConcatenate() ));
    }

    _computeBlockDataTransactionsConcatenate(){

        let bufferList = [];

        if (this._onlyHeader) // no transactions in headerBlocks
            return this.hashTransactions;

        for (let i=0; i<this.transactions.length; i++)
            bufferList.push( this.transactions[i].serializeTransaction() );

        return Buffer.concat( bufferList )

    }

    _serializeTransactions(onlyHeader = false){

        let list = [ Serialization.serializeToFixedBuffer( 32, this.hashTransactions ) ];

        if ( !onlyHeader  && !this._onlyHeader ) {
            list.push(Serialization.serializeNumber4Bytes(this.transactions.length));
            for (let i = 0; i < this.transactions.length; i++)
                list.push(this.transactions[i].serializeTransaction());
        }

        return Buffer.concat(list);
    }

    _computeBlockDataHeaderPrefix(onlyHeader = false){

        if (this.hashTransactions === undefined || this.hashTransactions === null)
            this.hashTransactions = this.calculateHashTransactions();

        return Buffer.concat ( [
            Serialization.serializeToFixedBuffer( consts.PUBLIC_ADDRESS_LENGTH, this.minerAddress ),
            this._serializeTransactions(onlyHeader),
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

        this.minerAddress = BufferExtended.substr(buffer, offset, consts.PUBLIC_ADDRESS_LENGTH );
        offset += consts.PUBLIC_ADDRESS_LENGTH;

        offset = this._deserializeTransactions(buffer, offset, onlyHeader);

        return offset;
    }

    _deserializeTransactions(buffer, offset, onlyHeader = false){

        this.hashTransactions = BufferExtended.substr(buffer, offset, 32 );
        offset += 32;

        if (!onlyHeader && !this._onlyHeader) {
            let length = Serialization.deserializeNumber(BufferExtended.substr(buffer, offset, 4));
            offset += 4;

            for (let i = 0; i < length; i++) {
                let transaction = new InterfaceBlockchainTransaction(this.blockchain, undefined, undefined, undefined, undefined, undefined);
                offset = transaction.deserializeTransaction(buffer, offset);
            }
        }

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