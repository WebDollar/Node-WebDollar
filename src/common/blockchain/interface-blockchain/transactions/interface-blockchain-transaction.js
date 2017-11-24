import InterfaceValidateTransaction from './validate-transactions/interface-validate-transaction'

class InterfaceBlockchainTransaction{

    /**
     * Transaction Class enables to create a new Transaction
     * @param from  must be an object {address: object , publicKey: object }
     * @param to  must be an object {address: object  }
     * @param amount
     * @param currency
     */

    constructor(from, to, amount, currency){

        this.from = null;
        this.to = null;
        this.amount = null;
        this.currency = null;

        this._setTransactionAddresses(from, to);
        this._setTransactionValue();

    }

    _setTransactionAddresses(from, to){

        from = from || {}
        to = to || {}

        if (!from.address) throw 'From Address is not specified';
        if (!from.publicKey) throw 'From Public Key is not specified';

        if (!to.address) throw 'To Address is not specified';


        //validate addresses

        this.from = from;
        this.to = to;

    }

    _setTransactionValue(amount, currency){

        if (!amount) throw ('Amount is not specified')

        if (typeof amount !== 'number' || amount < 0) throw 'Amount is not a valid number';

        if (!currency) currency = ''

        this.amount = amount;
        this.currency = currency;

        // Validate the validity of Funds
        this._validateTransaction()

    }

    propagateTransaction(){



    }

    _validateTransaction(silent){

        let ValidateTransactions = new InterfaceValidateTransaction();

        let result = ValidateTransactions.validate(this.from, this.to, this.amount, this.currency)

        if (silent) //to don't show the throw message
            return result;
        else
            if (result === false) throw 'Transaction Validation pas not passed'

    }

}

export default InterfaceBlockchainTransaction