const BigNumber = require('bignumber.js');
import BufferExtended from "common/utils/BufferExtended"

class InterfaceBlockchainTransactionTo{


    /*

        addresses: [ { address: Addr1,  amount: amount}, ... ]
        fee: amount

     */

    constructor (addresses, fee){

        this.setTo(addresses, fee);

    }

    setTo(addresses, fee, currency){

        if (Array.isArray(addresses))
            addresses = [addresses];

        for (let i=0; i<addresses.length; i++) {
            if (typeof addresses[i].address === "string")
                addresses[i].address = BufferExtended.fromBase(addresses[i].address);

            if (typeof addresses[i].amount === "string" || typeof addresses[i].addresses[i].amount === "number")
                addresses[i].amount = new BigNumber(addresses[i].amount);
        }

        if (typeof fee === "string" || typeof fee === "number")
            fee = new BigNumber(fee);

        this.addresses = addresses;
        this.fee = fee;

    }

    toJSON(){
        return {
            addresses: this.addresses,
            fee: this.fee,
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

            if (!toObject.address || toObject.address === null) throw 'To.Object Address is not specified';

            if (!toObject.amount || typeof toObject.amount !== "number" ) throw 'To.Object Amount is not specified';
            if ( toObject.amount < 0) throw "To.Object Amount is an invalid number";

        });

        if (!this.fee || this.fee instanceof BigNumber === false ) throw 'To.fee is not valid ';

        if (this.fee.lessThan(0) ) throw "To.fee is smaller than 0";

        //Validate to.currency

        return true;
    }

    serializeTo(){

        return Buffer.concat([

        ]);

    }

    deserializeTo(buffer){

    }

}

export default InterfaceBlockchainTransactionTo;
