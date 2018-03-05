import BufferExtended from "common/utils/BufferExtended"
import Serialization from "common/utils/Serialization"
import consts from "consts/const_global"

//TODO MULTISIG TUTORIAL https://www.youtube.com/watch?v=oTsjMz3DaLs

class InterfaceBlockchainTransactionFrom{


    /*

        addresses [
            {
                unencodedAddress1,
                publicKey1,
                signature
            },
            {
                unencodedAddress2,
                publicKey2
                signature
            }

        ]

        currency: TokenObject,

     */

    constructor (addresses, currency){
        this.setFrom(addresses, currency);
    }

    setFrom(addresses, currency){

        if (typeof addresses === "object" && currency === undefined && addresses.hasOwnProperty('addresses') && addresses.hasOwnProperty('currency') ){
            addresses = addresses.addresses;
            currency = addresses.currency;
        }


        if (!Array.isArray(addresses))
            addresses = [addresses];


        addresses.forEach ( (fromObject, index) =>{

            if (typeof fromObject.unencodedAddress === "string")
                fromObject.unencodedAddress = BufferExtended.fromBase(fromObject.unencodedAddress);

            if (typeof fromObject.publicKey === "string")
                fromObject.publicKey = new Buffer (fromObject.publicKey, "hex");

            if (typeof fromObject.signature === "string")
                fromObject.signature = new Buffer (fromObject.signature, "hex");

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

            if (! fromObject.unencodedAddress || fromObject.unencodedAddress === null)
                throw 'From.address.unencodedAddress is not specified';

            if (! fromObject.publicKey || fromObject.publicKey === null)
                throw 'From.address.publicKey is not specified';

            if (! fromObject.signature || fromObject.signature === null)
                throw 'From.address.signature is not specified';

            if (!Buffer.isBuffer(fromObject.unencodedAddress) || fromObject.unencodedAddress.length !== consts.PUBLIC_ADDRESS_LENGTH )
                throw "From.address.unencodedAddress is not a buffer";

            if (!Buffer.isBuffer(fromObject.publicKey) || fromObject.publicKey.length !== consts.PUBLIC_KEY_LENGTH)
                throw "From.address.publicAddress is not a buffer";

            if (!Buffer.isBuffer(fromObject.signature) || fromObject.signature.length !== consts.TRANSACTIONS_SIGNATURE_LENGTH)
                throw "From.address.signature is not a buffer";

        });
        
        if (!this.currency || this.currency === null) throw 'From.currency is not specified';

        if (!Buffers.isBuffer(this.currency))
            throw 'To.currency is not  a buffer';

        //TODO validate currency

        return true;
    }

    findAddressIndex( unencodedAddress ){
        for (let i = 0; i<this.addresses.length; i++)
            if (address[i].unencodedAddress.equals( unencodedAddress ) ){
                return i;
                break;
            }
        return -1;
    }

    serializeForSignature( unencodedAddress, version, nonce, transactionTo ){

        let position = this.findAddressIndex(unencodedAddress);

        if (position === -1)
            throw "address was not found";

        return Buffer.concat ([

            Serialization.serializeNumber1Byte( version ),
            Serialization.serializeNumber1Byte( nonce ),
            Serialization.serializeToFixedBuffer( consts.PUBLIC_ADDRESS_LENGTH, this.addresses[position].unencodedAddress ),
            Serialization.serializeToFixedBuffer( consts.PUBLIC_KEY_LENGTH, this.addresses[position].publicKey ),
            transactionTo.serializeTo(),

        ]) ;

    }

    serializeFrom(){

        let addressesBuffer = [];

        for (let i = 0; i < this.addresses.length; i++){
            addressesBuffer.push( Serialization.serializeToFixedBuffer( consts.PUBLIC_ADDRESS_LENGTH, this.addresses[i].unencodedAddress ));
            addressesBuffer.push( Serialization.serializeToFixedBuffer( consts.PUBLIC_KEY_LENGTH, this.addresses[i].publicKey ));
            addressesBuffer.push( Serialization.serializeToFixedBuffer( consts.TRANSACTIONS_SIGNATURE_LENGTH, this.addresses[i].signature ));
        }

        return Buffer.concat ([

            Serialization.serializeNumber1Byte( this.addresses.length ),
            addressesBuffer,

            Serialization.serializeNumber1Byte( this.currency.length ),
            this.currency,
        ]);

    }

    deserializeFrom(buffer, offset){

        this.addresses = [];

        let length = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 1) );
        offset += 1;

        for (let i = 0; i < length; i++){

            let address = {};

            address.unencodedAddress = BufferExtended.substr(buffer, offset, consts.PUBLIC_ADDRESS_LENGTH);
            offset += consts.PUBLIC_ADDRESS_LENGTH;

            address.publicKey= BufferExtended.substr(buffer, offset, consts.PUBLIC_KEY_LENGTH);
            offset += consts.PUBLIC_KEY_LENGTH;

            address.signature= BufferExtended.substr(buffer, offset, consts.TRANSACTIONS_SIGNATURE_LENGTH);
            offset += consts.TRANSACTIONS_SIGNATURE_LENGTH;

            this.addresses.push(address);
        }

        let currencyLength =  Serialization.deserializeNumber( buffer, offset, 1 );

        this.currency = BufferExtended.substr(buffer, offset, currencyLength );
        offset += currencyLength;

        return offset;

    }

}

export default InterfaceBlockchainTransactionFrom;