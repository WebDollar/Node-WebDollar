import InterfaceValidateTransaction from './validate-transactions/Interface-Validate-Transaction'
import NodePropagationProtocol from 'common/sockets/protocol/node-propagation-protocol'
import PendingTransactionsList from 'common/blockchain/transactions/pending-transactions/Pending-Transactions-List'

import InterfaceValidateTransactionHelper from 'validate-transactions/helpers/Interface-Validate-Transaction-helper'

class InterfaceBlockchainTransaction{

    /*
        from: [ {address: object, publicKey: object, } ]
        to: [ {address: object, amount: number, currency: object } ]
     */

    /**
     * Transaction Class enables to create a new Transaction
     * @param from  must be an Array[ object {address: object , publicKey: object } ]
     * @param to  must be an Array [ object {address: object , amount, currency } }
     * @param pending
     *
     */

    constructor(from, to, pending){

        this.from = null;
        this.to = null;
        this.pending = pending||false;

        this._setTransactionAddressesFrom(from);
        this._setTransactionAddressesTo(to);

        // Validate the validity of Funds
        this._validateTransaction()

        if (!pending) {
            PendingTransactionsList.includePendingTransaction(this);
        }

    }

    _setTransactionAddressesFrom(from){

        from = InterfaceValidateTransactionHelper.validateFrom(from);

        //validate the ballance of from Addresses

        this.from = from;
    }

    _setTransactionAddressesTo(to){

        to = InterfaceValidateTransactionHelper.validateTo(to);

        //validate addresses

        this.to = to;
    }

    _propagateTransaction(){

        NodePropagationProtocol.propagateNewPendingTransaction(this)

    }

    _validateTransaction(silent){

        let ValidateTransactions = new InterfaceValidateTransaction();

        let result = ValidateTransactions.validate(this.from, this.to)

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