import BufferExtended from "common/utils/BufferExtended"

class InterfaceBlockchainTransactionFrom{


    /*

        address {
            publicAddress,
            publicKey,
        }

        currency: TokenObject,

     */

    constructor (address, currency){

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

        ]);

    }

}

export default InterfaceBlockchainTransactionFrom;