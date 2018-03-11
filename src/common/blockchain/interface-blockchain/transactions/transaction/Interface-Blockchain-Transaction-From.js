import BufferExtended from "common/utils/BufferExtended"
import Serialization from "common/utils/Serialization"
import consts from "consts/const_global"
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper';

const schnorr = require('schnorr');
const BigNumber = require('bignumber.js');

//TODO MULTISIG TUTORIAL https://www.youtube.com/watch?v=oTsjMz3DaLs

class InterfaceBlockchainTransactionFrom{


    /*

        addresses [
            {
                unencodedAddress1,
                publicKey1,
                signature
                amount
            },
            {
                unencodedAddress2,
                publicKey2
                signature
                amount
            }

        ]

        currencyTokenId: TokenObject,

     */

    constructor (transaction, addresses, currencyTokenId){

        this.transaction = transaction;

        this.setFrom(addresses, currencyTokenId);
    }

    setFrom(addresses, currencyTokenId){

        if (typeof addresses === "object" && currencyTokenId === undefined && addresses.hasOwnProperty('addresses') && addresses.hasOwnProperty('currencyTokenId') ){
            addresses = addresses.addresses;
            currencyTokenId = addresses.currencyTokenId;
        }


        if (!Array.isArray(addresses))
            addresses = [addresses];

        addresses.forEach ( (fromObject, index) =>{

            if (typeof fromObject.unencodedAddress === "object" && fromObject.unencodedAddress.hasOwnProperty("unencodedAddress"))
                fromObject.unencodedAddress = fromObject.unencodedAddress.unencodedAddress;

            fromObject.unencodedAddress = InterfaceBlockchainAddressHelper.validateAddressChecksum(fromObject.unencodedAddress);

            if (typeof fromObject.publicKey === "string")
                fromObject.publicKey = new Buffer (fromObject.publicKey, "hex");

            if (typeof fromObject.signature === "string")
                fromObject.signature = new Buffer (fromObject.signature, "hex");

            if (fromObject.amount  instanceof BigNumber === false)
                fromObject.amount = new BigNumber(fromObject.amount);

        });

        if (currencyTokenId === undefined){
            currencyTokenId = new Buffer(consts.MINI_BLOCKCHAIN.TOKEN_CURRENCY_ID_LENGTH);
            currencyTokenId[0] = 0x01;
        }

        this.addresses = addresses;
        this.currencyTokenId = currencyTokenId;
    }

    toJSON(){
        return {
            addresses: this.addresses,
            currencyTokenId: this.currencyTokenId,
        }
    }

    /**
     * valdiateFrom object
     * @returns from
     */
    validateFrom(){

        if (this.addresses.length === 0)
            throw {message: "From.addresses is empty", addresses: this.addresses};

        if (!this.currencyTokenId || this.currencyTokenId === null) throw {message: 'From.currency is not specified', currencyTokenId: this.currencyTokenId};

        if (!Buffer.isBuffer(this.currencyTokenId))
            throw {message: 'To.currencyTokenId is not a buffer', currencyTokenId: this.currencyTokenId};

        if (! (this.currencyTokenId.length === consts.MINI_BLOCKCHAIN.TOKEN_CURRENCY_ID_LENGTH || this.currencyTokenId.length === consts.MINI_BLOCKCHAIN.TOKEN_CURRENCY_ID_LENGTH) )
            throw { message: "To.currencyTokenId is not valid", currencyTokenId: this.currencyTokenId };

        //TODO validate currency



        this.addresses.forEach ( (fromObject, index) =>{

            if (! fromObject.unencodedAddress || fromObject.unencodedAddress === null)
                throw { message: 'From.address.unencodedAddress is not specified', address: fromObject, index: index };

            if (! InterfaceBlockchainAddressHelper.validateAddressChecksum(fromObject.unencodedAddress) )
                throw { message: "From.address.unencodedAddress is not a valid address", address: fromObject, index: index };

            if (! fromObject.publicKey || fromObject.publicKey === null)
                throw { message: 'From.address.publicKey '+index+' is not specified', address: fromObject, index: index };

            if (!Buffer.isBuffer(fromObject.unencodedAddress) || fromObject.unencodedAddress.length !== consts.ADDRESSES.ADDRESS.WIF.LENGTH )
                throw { message: "From.address.unencodedAddress "+index+" is not a buffer", address: fromObject, index: index };

            if (!Buffer.isBuffer(fromObject.publicKey) || fromObject.publicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH)
                throw { message: "From.address.publicAddress "+index+" is not a buffer", address: fromObject, index: index };

            if (fromObject.amount instanceof BigNumber === false )
                throw { message: "From.address.amount "+index+" is not a number", address: fromObject, index: index };

            let value = this.transaction.blockchain.accountantTree.getBalance( fromObject.unencodedAddress, this.currencyTokenId );
            if (value.isLessThan(fromObject.amount))
                throw { message: "Value is Less than From.address.amount", address: fromObject, index: index };

            if ( fromObject.amount.isLessThanOrEqualTo(0) )
                throw {message: "Amount is an invalid number", address: fromObject, index: index };


        });

        this.validateSignatures();


        return true;
    }

    calculateInputSum(){

        //validate amount
        let inputValues = [], inputSum = BigNumber(0);

        for (let i=0; i<this.addresses.length; i++ ){
            inputValues.push( this.addresses[i].amount );
            inputSum = inputSum.plus( this.addresses[i].amount );
        }

        return inputSum;
    }

    findAddressIndex( unencodedAddress ){

        //in case it is a WIF address
        unencodedAddress = InterfaceBlockchainAddressHelper.validateAddressChecksum(unencodedAddress);

        for (let i = 0; i<this.addresses.length; i++)
            if (this.addresses[i].unencodedAddress.equals( unencodedAddress ) )
                return i;

        return -1;
    }

    serializeForSigning( unencodedAddress){

        let position;

        if (typeof unencodedAddress === "number")
            position = unencodedAddress;
        else
            position = this.findAddressIndex(unencodedAddress);

        if (position < 0 || position > this.addresses.length)
            throw "address was not found";

        return Buffer.concat ([

            Serialization.serializeNumber1Byte( this.transaction.version ),
            Serialization.serializeNumber1Byte( this.transaction.nonce ),
            Serialization.serializeToFixedBuffer( consts.ADDRESSES.ADDRESS.WIF.LENGTH, this.addresses[position].unencodedAddress ),
            Serialization.serializeToFixedBuffer( consts.ADDRESSES.PUBLIC_KEY.LENGTH, this.addresses[position].publicKey ),
            this.transaction.to.serializeTo(),

        ]) ;

    }

    validateSignatures(){

        this.addresses.forEach( (fromObject, index) =>{

            if (! fromObject.signature || fromObject.signature === null)
                throw {message: 'From.address.signature is not specified' , address: fromObject, index: index };

            if (!Buffer.isBuffer(fromObject.signature) || fromObject.signature.length !== consts.TRANSACTIONS_SIGNATURE_LENGTH)
                throw {message: "From.address.signature "+index+" is not a buffer", address: fromObject, index: index };

            let verification = schnorr.verify( this.serializeForSigning(index) , fromObject.signature, fromObject.publicKey );

            if (!verification){
                throw {message: "From.address.signature "+index+" is not correct", address: fromObject, index: index };
            }

        });

    }

    serializeFrom(){

        let array = [];

        array.push( Serialization.serializeNumber1Byte( this.addresses.length ));
        for (let i = 0; i < this.addresses.length; i++){
            array.push( Serialization.serializeToFixedBuffer( consts.ADDRESSES.ADDRESS.WIF.LENGTH, this.addresses[i].unencodedAddress ));
            array.push( Serialization.serializeToFixedBuffer( consts.ADDRESSES.PUBLIC_KEY.LENGTH, this.addresses[i].publicKey ));
            array.push( Serialization.serializeToFixedBuffer( consts.TRANSACTIONS_SIGNATURE_LENGTH, this.addresses[i].signature ));
            array.push( Serialization.serializeBigNumber( this.addresses[i].amount ));
        }

        array.push(Serialization.serializeNumber1Byte( this.currencyTokenId.length ));
        array.push(Serialization.serializeNumber1Byte( this.currencyTokenId ));

        return Buffer.concat (array);

    }

    deserializeFrom(buffer, offset){

        this.addresses = [];

        let length = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 1) );
        offset += 1;

        for (let i = 0; i < length; i++){

            let address = {};

            address.unencodedAddress = BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.WIF.LENGTH);
            offset += consts.ADDRESSES.ADDRESS.WIF.LENGTH;

            address.publicKey= BufferExtended.substr(buffer, offset, consts.ADDRESSES.PUBLIC_KEY.LENGTH);
            offset += consts.ADDRESSES.PUBLIC_KEY.LENGTH;

            address.signature= BufferExtended.substr(buffer, offset, consts.TRANSACTIONS_SIGNATURE_LENGTH);
            offset += consts.TRANSACTIONS_SIGNATURE_LENGTH;

            address.signature = BufferExtended.substr(buffer, offset, consts.TRANSACTIONS_SIGNATURE_LENGTH);
            offset += consts.TRANSACTIONS_SIGNATURE_LENGTH;

            let result = Serialization.deserializeBigNumber(buffer, offset);
            address.amount = result.number;
            offset += result.newOffset;

            this.addresses.push(address);
        }

        let currencyLength =  Serialization.deserializeNumber( buffer, offset, 1 );

        this.currencyTokenId = BufferExtended.substr(buffer, offset, currencyLength );
        offset += currencyLength;

        return offset;

    }

    updateAccountantTreeFrom(multiplicationFactor=1){

        let lastPosition;

        try {

            for (let i = 0; i < this.addresses.length; i++) {

                if (this.addresses[i].amount instanceof BigNumber === false) throw {message: "amount is not BigNumber",  address: this.addresses[i]};

                let result = this.transaction.blockchain.updateAccount( this.addresses[i].unencodedAddress, this.addresses[i].amount.multipliedBy(multiplicationFactor).negated(), this.currencyTokenId);

                if (result !== null) throw {message: "error Updating Account", address: this.addresses[i]};

            }

        } catch (exception){

            for (let i=lastPosition; i >= 0 ; i--) {
                let result = this.transaction.blockchain.updateAccount(this.addresses[i].unencodedAddress, this.addresses[i].amount.multipliedBy(multiplicationFactor), this.currencyTokenId);

                if (result !== null) throw {message: "error Updating Account", address: this.addresses[i]};
            }

        }

    }

}

export default InterfaceBlockchainTransactionFrom;