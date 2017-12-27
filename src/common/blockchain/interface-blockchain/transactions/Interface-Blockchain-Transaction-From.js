import BufferExtended from "common/utils/BufferExtended"
import Serialization from "common/utils/Serialization"

class InterfaceBlockchainTransactionFrom{


    /*

        address {
            publicAddress,
            publicKey,
        }

        currency: TokenObject,

     */

    constructor (address, currency){

        this.setFrom(address, currency);

    }

    setFrom(address, currency){

        // in case address is actually an object {address: {publicAddress:adr, publicKey: adr}, currency: object }
        if (typeof address === "object" && address.hasOwnProperty("address") && address.hasOwnProperty("currency")){
            currency = address.currency;
            address = address.address;
        }

        if (typeof address.publicAddress === "string"){
            address.publicAddress = BufferExtended.fromBase(address.publicAddress);
        }

        if (typeof address.publicKey === "string"){
            address.publicKey = new Buffer (address.publicKey, "hex");
        }

        this.address = address;
        this.currency = currency;

    }

    toJSON(){
        return {
            address: this.address,
            currency: this.currency,
        }
    }

    /**
     * valdiateFrom object
     * @returns from
     */
    validateFrom(){

        if (!this.address.publicAddress || this.address.publicAddress === null) throw 'From.address.publicAddress is not specified';
        if (!this.address.publicKey || this.address.publicKey === null) throw 'From.address.publicKey is not specified';

        if (!Buffer.isBuffer(this.address.publicAddress)) throw "From.address.publicAddress is not a buffer";
        if (!Buffer.isBuffer(this.address.publicKey)) throw "From.address.publicAddress is not a buffer";

        if (!this.currency || this.currency === null) throw 'To.currency is not specified';
        //Validate to.currency

        return true;
    }

    serializeFrom(){

        return Buffer.concat ([

            Serialization.serializeToFixedBuffer( 32, this.address.publicAddress ),
            Serialization.serializeToFixedBuffer( 32, this.address.publicKey ),

            Serialization.serializeNumber1Byte( this.currency.length ),
            this.currency,

        ]);

    }

    deserializeFrom(buffer, offset){

        this.address = {};
        this.address.publicAddress = BufferExtended.substr(buffer, offset, 32);
        offset += 32;

        this.address.publicKey = BufferExtended.substr(buffer, offset, 32);
        offset += 32;

        let currencyLength =  Serialization.deserializeNumber( buffer, offset, 1 );
        this.currency = BufferExtended.substr(buffer, offset, currencyLength );
        offset += currencyLength;

        return offset;

    }

}

export default InterfaceBlockchainTransactionFrom;