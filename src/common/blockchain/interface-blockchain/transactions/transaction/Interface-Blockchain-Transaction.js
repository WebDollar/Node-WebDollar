import InterfaceBlockchainTransactionFrom from './Interface-Blockchain-Transaction-From'
import InterfaceBlockchainTransactionTo from './Interface-Blockchain-Transaction-To'
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";
import WebDollarCryptoData from "common/crypto/WebDollar-Crypto-Data";

import Serialization from "common/utils/Serialization"
import BufferExtended from "common/utils/BufferExtended"
import consts from "consts/const_global";

class InterfaceBlockchainTransaction{


    /**
     * Transaction Class enables to create a new Transaction
     * @param from  must be an Array[ object {address: object , publicKey: object } ]
     * @param to  must be an Array [ object {address: object , amount, currency } }
     * @param nonce - usually null
     * @param txId - usually null
     */

    constructor( blockchain, from, to, nonce, timeLock, version, txId, validateFrom=true, validateTo=true){

        this.blockchain = blockchain;
        this.from = null;
        this.to = null;

        if (timeLock === undefined)
            this.timeLock = blockchain.blocks.length-1;

        this.version = version||0x00; //version

        try {

            if (!(from instanceof InterfaceBlockchainTransactionFrom))
                from = this._createTransactionFrom(from);

            this.from = from;

            if (validateFrom)
                this.from.validateFrom();

        } catch (exception){

            console.error("Transaction From Error", exception);
            throw typeof exception === "string" ? "Transaction From Error " + exception : exception;

        }

        try{

            if (! (to instanceof InterfaceBlockchainTransactionTo) )
                to = this._createTransactionTo(to);

            this.to = to;

            if (validateTo)
                this.to.validateTo();

        } catch (exception){

            console.error("Transaction To Error", exception);
            throw typeof exception === "string" ? "Transaction To Error " + exception : exception;
        }

        if (nonce === undefined || nonce === null)
            nonce = this._computeNonce();

        this.nonce = nonce; //1 bytes

        if (txId === undefined || txId === null)
            txId = this._computeTxId();

        this.txId = txId;

    }

    _createTransactionFrom(from){
        return new InterfaceBlockchainTransactionFrom(this, from);
    }

    _createTransactionTo(to){
        return new InterfaceBlockchainTransactionTo(this, to);
    }

    _computeNonce(){
        //it will be replaced by MiniBlockchain
        return Math.floor(Math.random() * 0xFF);
    }

    _computeTxId(){
        return WebDollarCrypto.SHA256( WebDollarCrypto.SHA256( this.serializeTransaction() ));
    }

    /**
     *
     * @param address requires .publicKey and .address
     * @param currency
     */
    setTransactionAddressFrom(address, currency){
        //validate the ballance of from.address
        this.from = this.from.setFrom(address, currency);
    }

    setTransactionAddressesTo( addresses, fee ){
        //validate addresses
        this.to = this.to.setTo( addresses, fee );
    }


    /**
     * Validate the Transaction
     * @param silent
     * @returns {*}
     */
    validateTransaction( blockHeight ){

        if (typeof this.nonce !== 'number') throw {message: 'nonce is empty', nonce: this.nonce};
        if (typeof this.version  !== "number") throw {message: 'version is empty', version:this.version};
        if (typeof this.timeLock !== "number") throw {timeLock: 'timeLock is empty', timeLock:this.timeLock};

        if (this.version !== 0x00) throw {message: "version is ivnalid", version: this.version};
        if (this.timeLock > 0xFFFFFF || this.timeLock < 0) throw {message: "version is invalid", version: this.version};

        if (this.timeLock !== 0 && blockHeight < this.timeLock) throw {message: "blockHeight < timeLock", timeLock:this.timeLock};

        let txId = this._computeTxId();
        if (txId.equals( this.txId ) ) throw {message: "txid don't match"};

        //Validate nonce

        if (!this.from)
            throw { message: 'Transaction Validation Invalid: From was not specified', from: this.from };

        if (!this.to)
            throw { message: 'Transaction Validation Invalid: To was not specified', to: this.to };

        this.from.validateFrom();
        this.to.validateTo();

        //validate amount
        let inputSum = this.from.calculateInputSum();
        let outputSum = this.to.calculateOutputSum();

        if (inputSum.isLessThan(outputSum))
            throw {message: "Transaction Validation Input is smaller than Output", input: inputSum, output: outputSum};

        return true;
    }

    serializeFromForSigning(unencodedAddress){
        return this.from.serializeForSigning( unencodedAddress );
    }

    serializeTransaction(){

        let array = [

            Serialization.serializeNumber1Byte( this.version ),
            Serialization.serializeNumber1Byte( this.nonce ),
            Serialization.serializeNumber3Bytes( this.timeLock ), //16777216 it should be to 4 bytes afterwards

            this.from.serializeFrom(),
            this.to.serializeTo(),
        ];

        return Buffer.concat (array);
    }

    deserializeTransaction(buffer, offset){

        offset = offset || 0;

        if (!Buffer.isBuffer(buffer))
            buffer = WebDollarCryptoData.createWebDollarCryptoData(buffer).buffer;

        try{

            this.version = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 1) );
            offset += 1;

            this.nonce =   Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 1) );
            offset += 1;

            this.timeLock =  Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 3) );
            offset += 3;

            offset = this.from.deserializeFrom(buffer, offset);
            offset = this.to.deserializeTo(buffer, offset);

        } catch (exception){
            console.error("error deserializing a transaction ", exception);
            throw exception;
        }

        return offset;

    }

    toString(){

    }

    toJSON(dontIncludeTxId){

        let result = {
            from: this.from.toJSON(),
            to: this.to.toJSON(), //address,
            nonce: this.nonce,
            timeLock: this.timeLock,
        };

        if (!dontIncludeTxId )
            result.txId = this.txId;

        return result;
    }

    /**
     * It will update the Accountant Tree
     */

    processTransaction(multiplicationFactor=1){

        this.from.processTransactionFrom(multiplicationFactor);
        this.to.processTransactionTo(multiplicationFactor);

        return true;
    }

    _validateNonce(){
        //
    }


}

export default InterfaceBlockchainTransaction