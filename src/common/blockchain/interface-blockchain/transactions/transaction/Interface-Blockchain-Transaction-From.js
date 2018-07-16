import BufferExtended from "common/utils/BufferExtended"
import Serialization from "common/utils/Serialization"
import consts from "consts/const_global"
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper';

import ed25519 from "common/crypto/ed25519";
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"

//TODO MULTISIG TUTORIAL https://www.youtube.com/watch?v=oTsjMz3DaLs

class InterfaceBlockchainTransactionFrom {

    /**
     *
     * It Supports multiple from addresses - useful for compressing tx and allow mixers
     *
     *   addresses [
     *      {
     *          unencodedAddress1,
     *          publicKey1,
     *          signature1,
     *          amount1
     *      },
     *      {
     *          unencodedAddress2,
     *          publicKey2,
     *          signature2,
     *          amount2
     *      },
     *      {
     *          unencodedAddress3,
     *          publicKey3,
     *          signature3,
     *          amount3,
     *      },
     *   ]
     *
     **/

    constructor(transaction, addresses, currencyTokenId) {

        this.transaction = transaction;

        this.setFrom(addresses, currencyTokenId);
    }

    setFrom(addresses, currencyTokenId) {

        if (addresses === undefined) return false;

        if (typeof addresses === "object" && currencyTokenId === undefined && addresses.hasOwnProperty('addresses') && addresses.hasOwnProperty('currencyTokenId')) {
            addresses = addresses.addresses;
            currencyTokenId = addresses.currencyTokenId;
        }


        if (!Array.isArray(addresses))
            addresses = [addresses];

        addresses.forEach((fromObject, index) => {

            if (fromObject.unencodedAddress !== undefined) {

                if (typeof fromObject.unencodedAddress === "object" && fromObject.unencodedAddress.hasOwnProperty("unencodedAddress"))
                    fromObject.unencodedAddress = fromObject.unencodedAddress.unencodedAddress;

                fromObject.unencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(fromObject.unencodedAddress);

            } else if (fromObject.address !== undefined) {
                fromObject.unencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(fromObject.address);
            }

            if (typeof fromObject.publicKey === "string")
                fromObject.publicKey = new Buffer(fromObject.publicKey, "hex");

            if (typeof fromObject.signature === "string")
                fromObject.signature = new Buffer(fromObject.signature, "hex");

            if (typeof fromObject.amount === "string")
                fromObject.amount = parseInt(fromObject.amount);

        });

        addresses.forEach((fromObject, index) => {

            //optional
            if (fromObject.unencodedAddress === undefined)
                fromObject.unencodedAddress = InterfaceBlockchainAddressHelper._generateUnencodedAddressFromPublicKey(publicKey, false);

        });

        if (currencyTokenId === undefined) {
            currencyTokenId = new Buffer(consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.LENGTH);
            currencyTokenId[0] = consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.VALUE;
        }

        this.addresses = addresses;
        this.currencyTokenId = currencyTokenId;
    }

    /**
     * Convert the To to JSON array
     * @returns {{addresses: Array, currencyTokenId: string}}
     */
    toJSON() {

        let addresses = [];

        this.addresses.forEach((address) => {
            addresses.push({
                address: BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(address.unencodedAddress)),
                publicKey: address.publicKey.toString("hex"),
                signature: address.signature.toString("hex"),
                amount: address.amount.toString(),
            })
        });

        return {
            addresses: addresses,
            currencyTokenId: this.currencyTokenId.toString("hex"),
        }

    }

    /**
     * valdiateFrom object of a given Transaction
     * @returns from
     */
    validateFrom() {

        if (this.addresses.length === 0)
            throw {message: "From.addresses is empty", addresses: this.addresses};

        if (this.addresses.length >= 256) throw {message: "Too many inputs. Max 256"};

        if (!this.currencyTokenId || this.currencyTokenId === null) throw {
            message: 'From.currency is not specified',
            currencyTokenId: this.currencyTokenId
        };

        if (!Buffer.isBuffer(this.currencyTokenId))
            throw {message: 'To.currencyTokenId is not a buffer', currencyTokenId: this.currencyTokenId};

        if ( !(this.currencyTokenId.length === consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.LENGTH || this.currencyTokenId.length === consts.MINI_BLOCKCHAIN.TOKENS.OTHER_TOKENS.LENGTH))
            throw {message: "To.currencyTokenId is not valid", currencyTokenId: this.currencyTokenId};

        //TODO validate currency


        this.addresses.forEach((fromObject, index) => {

            if (!fromObject.publicKey || fromObject.publicKey === null)
                throw { message: 'From.address.publicKey ' + index + ' is not specified',  address: fromObject,  index: index };

            if (fromObject.unencodedAddress === undefined || fromObject.unencodedAddress === null)
                fromObject.unencodedAddress = InterfaceBlockchainAddressHelper._generateUnencodedAddressFromPublicKey(fromObject.publicKey);

            if (!fromObject.unencodedAddress || fromObject.unencodedAddress === null)
                throw {message: 'From.address.unencodedAddress is not specified', address: fromObject, index: index};

            if (!InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(fromObject.unencodedAddress))
                throw { message: "From.address.unencodedAddress is not a valid address",  address: fromObject,  index: index };

            if (!Buffer.isBuffer(fromObject.unencodedAddress) || fromObject.unencodedAddress.length !== consts.ADDRESSES.ADDRESS.LENGTH)
                throw { message: "From.address.unencodedAddress " + index + " is not a buffer", address: fromObject,  index: index };

            if (!Buffer.isBuffer(fromObject.publicKey) || fromObject.publicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH)
                throw { message: "From.address.publicAddress " + index + " is not a buffer",  address: fromObject,  index: index };

            if (!InterfaceBlockchainAddressHelper._generateUnencodedAddressFromPublicKey(fromObject.publicKey).equals(fromObject.unencodedAddress))
                throw { message: "From.address.unencodedAddress " + index + " doesn't match the publicKey", address: fromObject,  index: index };

            if (!WebDollarCoins.validateCoinsNumber(fromObject.amount))
                throw {message: 'From.Object Amount is not specified', amount: fromObject.amount, index: index};

            if (fromObject.amount <= 0)
                throw {message: "Amount is an invalid number", amount: fromObject.amount, index: index};

        });


        //validate of the value is done in the Mini Blockchain Transaction From

        this.validateSignatures();

        return true;
    }

    calculateInputSum() {

        //validate amount
        let inputValues = [], inputSum = 0;

        for (let i = 0; i < this.addresses.length; i++) {
            inputValues.push(this.addresses[i].amount);
            inputSum += this.addresses[i].amount;
        }

        return inputSum;
    }

    findAddressIndex(unencodedAddress) {

        //in case it is a WIF address
        unencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(unencodedAddress);

        for (let i = 0; i < this.addresses.length; i++)
            if (BufferExtended.safeCompare(this.addresses[i].unencodedAddress, unencodedAddress))
                return i;

        return -1;
    }

    serializeForSigning(unencodedAddress) {

        let position;

        if (typeof unencodedAddress === "number")
            position = unencodedAddress;
        else
            position = this.findAddressIndex(unencodedAddress);

        if (position < 0 || position > this.addresses.length)
            throw {message: "address was not found"};

        let array = [
            Serialization.serializeNumber1Byte( this.transaction.version ),
            this.transaction.version >= 0x02 ?  Serialization.serializeNumber2Bytes( this.transaction.nonce ) : Serialization.serializeNumber1Byte( this.transaction.nonce ),
            Serialization.serializeNumber3Bytes( this.transaction.timeLock ),
            Serialization.serializeToFixedBuffer( consts.ADDRESSES.ADDRESS.LENGTH, this.addresses[position].unencodedAddress ),
            Serialization.serializeToFixedBuffer( consts.ADDRESSES.PUBLIC_KEY.LENGTH, this.addresses[position].publicKey )
        ];

        if ( this.transaction.version >= 0x02 ) {
            array.push( this.addresses[0].publicKey ); //sign the first address as well
            array.push( Serialization.serializeNumber1Byte(this.addresses.length) ); //to be sure,
            array.push( Serialization.serializeNumber7Bytes(this.addresses[position].amount) );
        }

        array.push( this.transaction.to.serializeTo());

        return Buffer.concat( array ) ;

    }

    validateSignatures() {

        this.addresses.forEach((fromObject, index) => {

            if (!fromObject.signature || fromObject.signature === null)
                throw {message: 'From.address.signature is not specified', address: fromObject, index: index};


            if (!Buffer.isBuffer(fromObject.signature) || fromObject.signature.length !== consts.TRANSACTIONS.SIGNATURE_SCHNORR.LENGTH)
                throw { message: "From.address.signature " + index + " is not a buffer",  address: fromObject,  index: index };

            if (!ed25519.verify(fromObject.signature, this.serializeForSigning(index), fromObject.publicKey ))
                throw { message: "From.address.signature " + index + " is not correct",  address: fromObject,  index: index };

            if (!InterfaceBlockchainAddressHelper._generateUnencodedAddressFromPublicKey(fromObject.publicKey).equals( fromObject.unencodedAddress ) )
                throw { message: "From.address.publicKey " + index + " doesn't match address",  address: fromObject,  index: index };

        });

        return true;

    }

    serializeFrom() {

        let array = [];

        array.push(Serialization.serializeNumber1Byte(this.addresses.length));

        for (let i = 0; i < this.addresses.length; i++) {

            if (this.transaction.version <= 0x01)
                array.push(Serialization.serializeToFixedBuffer(consts.ADDRESSES.ADDRESS.LENGTH, this.addresses[i].unencodedAddress));

            array.push(Serialization.serializeToFixedBuffer( consts.ADDRESSES.PUBLIC_KEY.LENGTH, this.addresses[i].publicKey ));
            array.push(Serialization.serializeToFixedBuffer( consts.TRANSACTIONS.SIGNATURE_SCHNORR.LENGTH, this.addresses[i].signature ));
            array.push(Serialization.serializeNumber7Bytes( this.addresses[i].amount ));

        }

        array.push(Serialization.serializeNumber1Byte(this.currencyTokenId.length));
        array.push(this.currencyTokenId);

        return Buffer.concat(array);

    }

    deserializeFrom(buffer, offset) {

        this.addresses = [];


        try {

            let length = Serialization.deserializeNumber1Bytes(buffer, offset);
            offset += 1;


            for (let i = 0; i < length; i++) {

                let address = {};

                if (this.transaction.version <= 0x01) {
                    address.unencodedAddress = BufferExtended.substr(buffer, offset, consts.ADDRESSES.ADDRESS.LENGTH);
                    offset += consts.ADDRESSES.ADDRESS.LENGTH;
                }

                address.publicKey = BufferExtended.substr(buffer, offset, consts.ADDRESSES.PUBLIC_KEY.LENGTH);
                offset += consts.ADDRESSES.PUBLIC_KEY.LENGTH;

                address.signature = BufferExtended.substr(buffer, offset, consts.TRANSACTIONS.SIGNATURE_SCHNORR.LENGTH);
                offset += consts.TRANSACTIONS.SIGNATURE_SCHNORR.LENGTH;

                address.amount = Serialization.deserializeNumber7Bytes(buffer, offset);
                offset += 7;

                this.addresses.push(address);
            }

            let currencyLength = Serialization.deserializeNumber1Bytes(buffer, offset,);
            offset += 1;

            this.currencyTokenId = BufferExtended.substr(buffer, offset, currencyLength);
            offset += currencyLength;

        } catch (exception){

            console.error("error deserializing a transaction FROM ", exception);
            throw exception;

        }

        return offset;

    }

    processTransactionFrom(multiplicationFactor = 1, revertActions) {
        // overwritten in Mini Blockchain
    }

}

export default InterfaceBlockchainTransactionFrom;