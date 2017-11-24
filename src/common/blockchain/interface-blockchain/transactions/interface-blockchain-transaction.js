class InterfaceBlockchainTransaction{

    /**
     * Transaction Class enables to create a new Transaction
     * @param fromAddress
     * @param toAddress
     * @param amount
     * @param currency
     */
    constructor(fromAddress, toAddress, amount, currency){

        this._setTransactionAddresses(fromAddress, toAddress);
        this._setTransactionValue();
        this._propagateTransaction();

    }

    _setTransactionAddresses(fromAddress, toAddress){

        if (typeof fromAddress === 'undefined' || fromAddress === null )
            throw 'From Address is not specified';

        if (typeof toAddress === 'undefined' || toAddress === null)
            throw 'To Address ti not specified';

        //validate addresses

        this.fromAddress = fromAddress;
        this.toAddress = toAddress;

    }

    _setTransactionValue(amount, currency){

        if (typeof amount === 'undefined' || amount === null)
            throw ('Amount is not specified')


        if (typeof amount !== 'number')
            throw 'Amount is not valid'

        if (typeof currency === 'undefined') currency = ''

        // Validate the validity of Funds

    }

    propagateTransaction(){

    }

}