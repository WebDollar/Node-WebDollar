class InterfaceBlockchainTransactionFrom{


    /*

        address {
            publicAddress,
            publicKey,
        }

        currency: TokenObject,

     */

    constructor (address, currency){

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
     * @param from - must be an object
     * @returns from
     */
    static validateFrom(from){

        from = from || {}

        if (!from.address.publicAddress || from.address.publicAddress === null) throw 'From.address.publicAddress is not specified';
        if (!from.address.publicKey || from.address.publicKey === null) throw 'From.address.publicKey is not specified';

        if (!from.currency || from.currency === null) throw 'To.currency is not specified';
        //Validate to.currency

        return from;
    }

}

export default InterfaceBlockchainTransactionFrom;