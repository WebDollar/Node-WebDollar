import InterfaceValidateTransaction from './validate-transactions/interface-validate-transaction'
import NodePropagationProtocol from 'common/sockets/protocol/node-propagation-protocol'
import PendingTransactionsList from 'common/blockchain/transactions/pending-transactions/Pending-Transactions-List'

class InterfaceBlockchainTransaction{

    /**
     * Transaction Class enables to create a new Transaction
     * @param from  must be an object {address: object , publicKey: object }
     * @param to  must be an object {address: object  }
     * @param amount
     * @param currency
     * @param pending
     *
     */

    constructor(from, to, amount, currency, pending){

        this.from = null;
        this.to = null;
        this.amount = null;
        this.currency = null;
        this.pending = pending||false;

        this._setTransactionAddresses(from, to);
        this._setTransactionValue(amount, currency);

        if (!pending) {
            PendingTransactionsList.includePendingTransaction(this);
        }

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

    _propagateTransaction(){

        NodePropagationProtocol.propagateNewPendingTransaction(this)

    }

    _validateTransaction(silent){

        let ValidateTransactions = new InterfaceValidateTransaction();

        let result = ValidateTransactions.validate(this.from, this.to, this.amount, this.currency)

        if (silent) //to don't show the throw message
            return result;
        else
            if (result === false) throw 'Transaction Validation pas not passed'

    }

    toString(){

    }

    toJSON(){
        return {
            from: {
                address: this.from.address,
                publicKey: this.from.publicKey.toHex(),
            },
            to: this.to, //address,
            amount: this.amount,
            currency: this.currency,
        }
    }

}

export default InterfaceBlockchainTransaction