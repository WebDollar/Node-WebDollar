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
    validateFrom(){

        if (!this.address.publicAddress || this.address.publicAddress === null) throw 'From.address.publicAddress is not specified';
        if (!this.address.publicKey || this.address.publicKey === null) throw 'From.address.publicKey is not specified';

        if (!this.currency || this.currency === null) throw 'To.currency is not specified';
        //Validate to.currency

        return true;
    }

}

export default InterfaceBlockchainTransactionFrom;