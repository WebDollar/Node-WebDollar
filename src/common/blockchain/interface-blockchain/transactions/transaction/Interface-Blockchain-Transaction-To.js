const BigNumber = require('bignumber.js');

import BufferExtended from "common/utils/BufferExtended"
import Serialization from "common/utils/Serialization"
import consts from "consts/const_global"

class InterfaceBlockchainTransactionTo{

    /*
        addresses: [ { address: Addr1,  amount: amount}, ... ]
     */

    constructor (addresses){
        this.setTo(addresses);
    }

    setTo(addresses){

        if (Array.isArray(addresses))
            addresses = [addresses];

        for (let i = 0; i < addresses.length; i++) {
            if (typeof addresses[i].address === "string")
                addresses[i].address = BufferExtended.fromBase(addresses[i].address);

            if (typeof addresses[i].amount === "string" || typeof addresses[i].addresses[i].amount === "number")
                addresses[i].amount = new BigNumber(addresses[i].amount);
        }

        this.addresses = addresses;

    }

    toJSON(){
        return {
            addresses: this.addresses,
        }
    }

    /**
     * Validate To
     * @param to: object { addresses: [], fee: number, positive, currency: TokenObject ]
     * @returns  to
     */
    validateTo(){

        if (this.addresses.length === 0) throw 'To is empty Array';

        this.addresses.forEach ( (toObject, index) =>{

            if (!toObject.address || toObject.address === null || !Buffer.isBuffer(toObject.address))
                throw 'To.Object Address is not specified';

            if (!toObject.amount ||  toObject.amount instanceof BigNumber === false )
                throw 'To.Object Amount is not specified';

            if ( toObject.amount.isLessThan(0) )
                throw "To.Object Amount is an invalid number";

        });

        //Validate to.currency

        return true;
    }

    serializeTo(){

        let addressesBuffer = [];


        for (let i = 0; i < this.addresses.length; i++){
            addressesBuffer.push( Serialization.serializeToFixedBuffer( consts.PUBLIC_ADDRESS_LENGTH, this.addresses[i].address ));
            addressesBuffer.push( Serialization.serializeBigNumber( this.addresses[i].amount ));
        }

        return Buffer.concat ([

            Serialization.serializeNumber1Byte( this.addresses.length ),
            addressesBuffer,

        ]);

    }

    deserializeTo(buffer, offset){

        let length = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 1) );
        offset += 1;

        for (let i = 0; i < length; i++){
            let address = {};

            address.address= BufferExtended.substr(buffer, offset, consts.PUBLIC_ADDRESS_LENGTH);
            offset += consts.PUBLIC_ADDRESS_LENGTH;

            let result = Serialization.deserializeBigNumber(buffer, offset);
            address.amount = result.number;

            offset = result.newOffset;
        }

        return offset;
    }

}

export default InterfaceBlockchainTransactionTo;
