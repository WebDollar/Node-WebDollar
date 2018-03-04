import BufferExtended from "common/utils/BufferExtended"
import Serialization from "common/utils/Serialization"
import consts from "consts/const_global"

class InterfaceBlockchainTransactionFrom{


    /*

        addresses [
            {
                address1,
                publicKey1,
            },
            {
                address2,
                publicKey2
            }

        ]

        currency: TokenObject,

     */

    constructor (addresses, currency){

        this.setFrom(addresses, currency);

    }

    setFrom(addresses, currency){


        if (Array.isArray(addresses))
            addresses = [addresses];


        this.addresses.forEach ( (fromObject, index) =>{

            if (typeof fromObject.address === "string")
                fromObject.address = BufferExtended.fromBase(fromObject.address);

            if (typeof fromObject.publicKey === "string")
                fromObject.publicKey = new Buffer (fromObject.publicKey, "hex");

        });

        this.addresses = addresses;
        this.currency = currency;
    }

    toJSON(){
        return {
            addresses: this.addresses,
            currency: this.currency,
        }
    }

    /**
     * valdiateFrom object
     * @returns from
     */
    validateFrom(){


        this.addresses.forEach ( (fromObject, index) =>{


            if (! fromObject.address || fromObject.address === null)
                throw 'From.address.address is not specified';

            if (! fromObject.publicKey || fromObject.publicKey === null)
                throw 'From.address.publicKey is not specified';

            if (!Buffer.isBuffer(fromObject.publicAddress) || fromObject.publicAddress.length !== consts.PUBLIC_ADDRESS_LENGTH )
                throw "From.address.publicAddress is not a buffer";

            if (!Buffer.isBuffer(fromObject.publicKey) || fromObject.publicKey.length !== consts.PUBLIC_KEY_LENGTH)
                throw "From.address.publicAddress is not a buffer";


        });
        
        if (!this.currency || this.currency === null) throw 'From.currency is not specified';

        if (!Buffers.isBuffer(this.currency))
            throw 'To.currency is not  a buffer';
        //Validate to.currency

        return true;
    }

    serializeFrom(){

        return Buffer.concat ([

            Serialization.serializeToFixedBuffer( consts.PUBLIC_ADDRESS_LENGTH, this.address.publicAddress ),
            Serialization.serializeToFixedBuffer( consts.PUBLIC_KEY_LENGTH, this.address.publicKey ),

            Serialization.serializeNumber1Byte( this.currency.length ),
            this.currency,

        ]);

    }

    deserializeFrom(buffer, offset){

        this.address = {};
        this.address.publicAddress = BufferExtended.substr(buffer, offset, consts.PUBLIC_ADDRESS_LENGTH);
        offset += consts.PUBLIC_ADDRESS_LENGTH;

        this.address.publicKey = BufferExtended.substr(buffer, offset, consts.PUBLIC_KEY_LENGTH);
        offset += consts.PUBLIC_KEY_LENGTH;

        let currencyLength =  Serialization.deserializeNumber( buffer, offset, 1 );

        this.currency = BufferExtended.substr(buffer, offset, currencyLength );
        offset += currencyLength;

        return offset;

    }

}

export default InterfaceBlockchainTransactionFrom;