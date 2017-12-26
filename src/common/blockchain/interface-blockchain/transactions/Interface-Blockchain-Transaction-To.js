const BigNumber = require('bignumber.js');

class InterfaceBlockchainTransactionTo{


    /*

        addresses: [ { publicAddress: Addr1,  amount: amount}, ... ]
        fee: amount
        currency: TokenObject,

     */

    constructor (addresses, fee, currency){

        if (Array.isArray(addresses))
            addresses = [addresses];

        this.addresses = addresses;
        this.fee = fee;
        this.currency = currency;

    }

    toJSON(){
        return {
            addresses: this.addresses,
            fee: this.fee,
            currency: this.currency,
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
            if (toObject.amount < 0) throw "To.Object Amount is an invalid number";

        });

        if (!this.fee || this.fee instanceof BigNumber === false ) throw 'To.fee is not valid ';

        if (this.fee.lessThan(0) ) throw "To.fee is smaller than 0";

        if (!this.currency || this.currency === null) throw 'To.currency is not specified';

        //Validate to.currency

        return true;
    }

    serializeTo(){

        return Buffer.concat([

        ]);

    }

}

export default InterfaceBlockchainTransactionTo;
