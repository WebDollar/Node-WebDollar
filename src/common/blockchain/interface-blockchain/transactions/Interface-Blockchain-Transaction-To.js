class InterfaceBlockchainTransactionTo{


    /*

        addresses: [ { publicAddress: Addr1, amount: amount}, ... ]
        fee: amount
        currency: Object,

     */

    constructor (addresses, fee, currency){

        this.addresses = addresses;
        this.fee = fee;
        this.currency = currency;

    }

    /**
     * Validate To
     * @param to: object { address: [], fee: object, currency: Object ]
     * @returns {*|Array}
     */
    static validateTo(to){

        to = to || []

        if (!Array.isArray(to)) to = [to]

        if (to.length === 0) throw 'To is empty Array';

        to.forEach ((toObject, index) =>{

            if (!toObject.address || toObject.address === null) throw 'To.Object Address is not specified';

            if (!toObject.amount || typeof toObject.amount !== "number" ) throw 'To.Object Amount is not specified';
            if (toObject.amount < 0) throw "To.Object Amount is an invalid number";

        })

        if (!to.currency || to.currency === null) throw 'To.currency is not specified';
        if (!to.fee || typeof to.fee !== "number") throw 'To.fee is not specified';

        if (to.fee < 0) throw "To.fee is an invalid number";

        return to;
    }

}

export default InterfaceBlockchainTransactionTo;
