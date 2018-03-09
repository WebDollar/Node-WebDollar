
import InterfaceBlockchainTransactionFrom from './Interface-Blockchain-Transaction-From'
import InterfaceBlockchainTransactionTo from './Interface-Blockchain-Transaction-To'
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";
import WebDollarCryptoData from "common/crypto/WebDollar-Crypto-Data";

import Serialization from "common/utils/Serialization"
import BufferExtended from "common/utils/BufferExtended"

class InterfaceBlockchainTransaction{


    /**
     * Transaction Class enables to create a new Transaction
     * @param from  must be an Array[ object {address: object , publicKey: object } ]
     * @param to  must be an Array [ object {address: object , amount, currency } }
     * @param nonce - usually null
     * @param txId - usually null
     *
     *
     */

    constructor(blockchain, from, to, nonce, txId, validateFrom=true, validateTo=true){

        this.blockchain = blockchain;
        this.from = null;
        this.to = null;


        this.version = 0x00; //version

        if (nonce === undefined || nonce === null)
            nonce = this._computeRandomNonce();

        this.nonce = nonce; //2 bytes

        try {

            if (!(from instanceof InterfaceBlockchainTransactionFrom))
                from = new InterfaceBlockchainTransactionFrom(this, from);

            this.from = from;

            if (validateFrom)
                this.from.validateFrom();

        } catch (exception){

            console.error("Transaction From Error", exception);
            throw typeof exception === "string" ? "Transaction From Error " + exception : exception;

        }

        try{

            if (! (to instanceof InterfaceBlockchainTransactionTo) )
                to = new InterfaceBlockchainTransactionTo(this, to);

            this.to = to;

            if (validateTo)
                this.to.validateTo();

        } catch (exception){

            console.error("Transaction To Error", exception);
            throw typeof exception === "string" ? "Transaction To Error " + exception : exception;
        }

        if (txId === undefined || txId === null)
            txId = this._computeTxId();

        this.txId = txId;

    }

    _computeRandomNonce(){
        return Math.floor(Math.random() * 0xffff);
    }

    _computeTxId(){
        this.txId = WebDollarCrypto.SHA256( WebDollarCrypto.SHA256( this.serializeTransaction() ));
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
    validateTransaction(){

        if (this.nonce === undefined || this.nonce === null || typeof this.nonce !== 'number')
            throw ('nonce is empty');

        if (!this.from)
            throw 'Transaction Validation Invalid: From was not specified';
        
        if (!this.from.address)
            throw 'Transaction Validation Invalid: from.Address was not specified'

        if (!this.to)
            throw 'Transaction Validation Invalid: To was not specified'

        this.from.validateFrom();
        this.to.validateTo();

        //validate amount
        let inputSum = this.from.calculateInputSum();
        let outputSum = this.to.calculateOutputSum();

        if (inputSum.isLessThan(outputSum))
            throw "Transaction Validation Input is smaller than Output";

        return true;

    }

    serializeFromForSigning(unencodedAddress){
        return this.from.serializeForSigning( unencodedAddress, this.version, this.nonce, this.to );
    }

    serializeTransaction(){

        let array = [
            Serialization.serializeNumber1Byte( this.version ),
            Serialization.serializeNumber1Byte( this.nonce ),
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
        };

        if (!dontIncludeTxId )
            result.txId = this.txId;

        return result;

    }

}

export default InterfaceBlockchainTransaction