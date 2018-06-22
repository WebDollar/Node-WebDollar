import InterfaceBlockchainTransactionFrom from './Interface-Blockchain-Transaction-From'
import InterfaceBlockchainTransactionTo from './Interface-Blockchain-Transaction-To'
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";
import WebDollarCryptoData from "common/crypto/WebDollar-Crypto-Data";

import Serialization from "common/utils/Serialization"
import BufferExtended from "common/utils/BufferExtended"
import consts from "consts/const_global";
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"

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

        this._confirmed = false;

        if (timeLock === undefined)
            this.timeLock = blockchain.blocks.length-1;

        if (version === undefined){

            if (this.timeLock < consts.BLOCKCHAIN.HARD_FORKS.TRANSACTIONS_BUG_2_BYTES ) version = 0x00;
            if (this.timeLock >= consts.BLOCKCHAIN.HARD_FORKS.TRANSACTIONS_BUG_2_BYTES ) version = 0x01;

        }

        this.version = version; //version

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

        if (version === 0x00) nonce = nonce % 0x100;
        else if (version === 0x01) nonce = nonce % 0X10000;

        this.nonce = nonce; //1 bytes

        if (txId === undefined || txId === null)
            txId = this._computeTxId();

        this.txId = txId;
    }

    destroyTransaction(){
        this.blockchain = undefined;
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

    recalculateTxId(){
        this.txId = this._computeTxId();
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
    validateTransactionOnce( blockHeight, blockValidationType = {} ){

        if (blockHeight === undefined) blockHeight = this.blockchain.blocks.length-1;

        if (typeof this.nonce !== 'number') throw {message: 'nonce is empty', nonce: this.nonce};
        if (typeof this.version  !== "number") throw {message: 'version is empty', version:this.version};
        if (typeof this.timeLock !== "number") throw {message: 'timeLock is empty', timeLock:this.timeLock};

        if (this.timeLock < consts.BLOCKCHAIN.HARD_FORKS.TRANSACTIONS_BUG_2_BYTES && this.version !== 0x00) throw {message: "version is ivnalid", version: this.version};
        if (this.timeLock >= consts.BLOCKCHAIN.HARD_FORKS.TRANSACTIONS_BUG_2_BYTES && this.version !== 0x01) throw {message: "version is ivnalid", version: this.version};

        if (this.nonce > 0xFFFF) throw {message: "nonce is ivnalid", nonce : this.nonce};
        if (this.timeLock > 0xFFFFFF || this.timeLock < 0) throw {message: "version is invalid", version: this.version};

        if (this.timeLock !== 0 && blockHeight < this.timeLock) throw {message: "blockHeight < timeLock", timeLock:this.timeLock, blockHeight: blockHeight };
        if (this.timeLock - blockHeight > 100) throw { message: "timelock - blockHeight < 100", timelock : this.timelock };

        let txId = this._computeTxId();
        if (! BufferExtended.safeCompare(txId, this.txId ) ) throw {message: "txid don't match"};

        if (!this.from)
            throw { message: 'Transaction Validation Invalid: From was not specified', from: this.from };

        if (!this.to)
            throw { message: 'Transaction Validation Invalid: To was not specified', to: this.to };

        this.from.validateFrom();
        this.to.validateTo();

        if (!this.validateIdenticalAddresses(this.from.addresses)) return false;
        if (!this.validateIdenticalAddresses(this.to.addresses)) return false;

        //validate amount
        let inputSum = this.from.calculateInputSum();
        let outputSum = this.to.calculateOutputSum();

        if (!WebDollarCoins.validateCoinsNumber(inputSum))
            throw {message: "Transaction inputSum is invalid", inputSum: inputSum};

        if (!WebDollarCoins.validateCoinsNumber(outputSum))
            throw {message: "Transaction outputSum is invalid", inputSum: outputSum};

        if (inputSum < outputSum)
            throw {message: "Transaction Validation Input is smaller than Output", input: inputSum, output: outputSum};

        if (!this.validateTransactionEveryTime(blockHeight, blockValidationType))
            return false;

        return true;
    }

    validateTransactionEveryTime( blockHeight , blockValidationType = {}){

        if (this.blockchain === undefined) throw {message: "blockchain is empty"};

        if (blockHeight === undefined) blockHeight = this.blockchain.blocks.length-1;

        if (this.timeLock !== 0 && blockHeight < this.timeLock) throw {message: "blockHeight < timeLock", timeLock: this.timeLock};

        if (blockValidationType === undefined || !blockValidationType['skip-validation-transactions-from-values']){

            if (! this._validateNonce(blockValidationType) ) throw {message: "Nonce is invalid" };

            return this.from.validateFromEnoughMoney(blockValidationType);
        }

        return true;
    }


    isTransactionOK(avoidValidatingSignature = false){

        if (!avoidValidatingSignature)
            this.validateTransactionOnce(undefined,  { 'skip-validation-transactions-from-values': true } );

        try {
            let blockValidationType = {
                "take-transactions-list-in-consideration": {
                    validation: true
                }
            };
            this.validateTransactionEveryTime(undefined, blockValidationType );

        } catch (exception){
            console.warn ("Transaction had not enough money, so I am skipping it", exception);
            return false;
        }

        return true;
    }

    serializeFromForSigning(unencodedAddress){
        return this.from.serializeForSigning( unencodedAddress );
    }

    serializeTransaction(){

        let array = [

            Serialization.serializeNumber1Byte( this.version ),

            this.version === 0x00 ? Serialization.serializeNumber1Byte( this.nonce ) :  Serialization.serializeNumber2Bytes( this.nonce ),

            Serialization.serializeNumber3Bytes( this.timeLock ), //16777216 it should be to 4 bytes afterwards

            this.from.serializeFrom(),
            this.to.serializeTo(),

        ];

        return Buffer.concat (array);
    }

    serializeTransactionId(){
        return this.txId;
    }

    deserializeTransaction(buffer, offset){

        offset = offset || 0;

        if (!Buffer.isBuffer(buffer))
            buffer = WebDollarCryptoData.createWebDollarCryptoData(buffer).buffer;

        try{

            this.version = Serialization.deserializeNumber1Bytes( buffer, offset );
            offset += 1;

            //hard fork
            if (this.version === 0x00){
                this.nonce = Serialization.deserializeNumber1Bytes( buffer, offset);
                offset += 1;
            } else if (this.version === 0x01){
                this.nonce = Serialization.deserializeNumber2Bytes( buffer, offset);
                offset += 2;
            }

            this.timeLock =  Serialization.deserializeNumber3Bytes( buffer, offset );
            offset += 3;

            offset = this.from.deserializeFrom(buffer, offset);
            offset = this.to.deserializeTo(buffer, offset);

        } catch (exception){

            console.error("error deserializing a transaction ", exception);
            throw exception;

        }

        this.recalculateTxId();

        return offset;

    }

    toString(){

    }

    toJSON(dontIncludeTxId){

        let result = {
            from: this.from.toJSON(),
            to: this.to.toJSON(), //address,
            nonce: this.nonce,
            version: this.version,
            timeLock: this.timeLock,
            confirmed: this.confirmed,
        };

        if (!dontIncludeTxId )
            result.txId = this.txId.toString("hex");

        return result;
    }

    /**
     * It will update the Accountant Tree
     */

    _preProcessTransaction(multiplicationFactor = 1 , minerAddress, revertActions){
        return true;
    }

    processTransaction(multiplicationFactor = 1 , minerAddress, revertActions, showUpdate){

        if ( multiplicationFactor === 1 ) { // adding transaction

            //nonce
            if (!this._preProcessTransaction(multiplicationFactor, minerAddress, revertActions, showUpdate)) return false;

            if (!this.from.processTransactionFrom(multiplicationFactor, revertActions, showUpdate)) return false;
            if (!this.to.processTransactionTo(multiplicationFactor, revertActions, showUpdate)) return false;

            if (this._processTransactionFees(multiplicationFactor, minerAddress, revertActions, showUpdate) === null) return false;

        } else if (multiplicationFactor === -1) { // removing transaction

            //nonce
            if (this._processTransactionFees(multiplicationFactor, minerAddress, revertActions, showUpdate) === null) return false;

            if (!this.to.processTransactionTo(multiplicationFactor, revertActions, showUpdate)) return false;
            if (!this.from.processTransactionFrom(multiplicationFactor, revertActions, showUpdate)) return false;

            if (!this._preProcessTransaction(multiplicationFactor, minerAddress, revertActions, showUpdate)) return false;


        }else
            throw {message: "multiplicationFactor is illegal"};

        return true;
    }

    _processTransactionFees(){

        let inputSum = this.from.calculateInputSum();
        let outputSum = this.to.calculateOutputSum();

        let diffInFees = inputSum - outputSum;

        if (!WebDollarCoins.validateCoinsNumber(diffInFees))
            throw {message:"Fees are invalid"};

        if (diffInFees < 0) throw {message: "Fee is illegal"};

        return {fees: diffInFees, currencyTokenId: this.from.currencyTokenId};
    }

    _validateNonce(blockValidation){
        return true;
    }

    get confirmed(){
        return this._confirmed;
    }

    set confirmed(newValue){

        if (this._confirmed !== newValue)
            this._confirmed = newValue;

        this.blockchain.transactions.emitTransactionChangeEvent(this);

    }

    get fee(){
        //validate amount
        let inputSum = this.from.calculateInputSum();
        let outputSum = this.to.calculateOutputSum();

        return inputSum - outputSum;
    }


    validateIdenticalAddresses(addresses){

        for (let i=0; i<addresses.length; i++)
            for (let j=i+1; j<addresses.length; j++)
                if (BufferExtended.safeCompare ( addresses[i].unencodedAddress, addresses[j].unencodedAddress))
                    throw {message: "address has identical inputs"};

        return true;
    }


}

export default InterfaceBlockchainTransaction