
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
     * @param digitalSignature - using Elliptic Curve to digital sign the transaction
     * @param nonce - usually null
     * @param txId - usually null
     *
     *
     */

    constructor(blockchain, from, to, digitalSignature, nonce, txId){

        this.blockchain  = blockchain;

        this.from = null;
        this.to = null;

        this.digitalSignature = digitalSignature;

        this.version = 0x00; //version

        if (nonce === undefined || nonce === null)
            nonce = this._computeRandomNonce();

        this.nonce = nonce; //2 bytes

        if (! from instanceof InterfaceBlockchainTransactionFrom)
            this.from = new InterfaceBlockchainTransactionFrom(from);

        if (! to instanceof InterfaceBlockchainTransactionTo)
            this.to = new InterfaceBlockchainTransactionTo(to);

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
            throw 'Validation Invalid: From was not specified';
        
        if (!this.from.address)
            throw 'Validation Invalid: from.Address was not specified'

        if (!this.to)
            throw 'Validation Invalid: To was not specified'

        this.from.validateFrom();
        this.to.validateTo();

        return true;

    }

    serializeTransaction(){

        return Buffer.concat ([

            Serialization.serializeNumber1Byte( this.version ),
            Serialization.serializeNumber2Bytes( this.nonce ),
            Serialization.serializeToFixedBuffer( 32, this.digitalSignature ),

            this.from.serializeFrom(),
            this.to.serializeTo(),
        ]);
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

            this.digitalSignature = BufferExtended.substr(buffer, offset, 32);
            offset += 32;

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
            digitalSignature: this.digitalSignature,
            nonce: this.nonce,
        };

        if (!dontIncludeTxId )
            result.txId = this.txId;

        return result;

    }

}

export default InterfaceBlockchainTransaction