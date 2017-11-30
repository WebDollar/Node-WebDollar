import InterfaceValidateTransaction from './validate-transactions/Interface-Validate-Transaction'
import NodePropagationProtocol from 'common/sockets/protocol/node-propagation-protocol'
import PendingTransactionsList from 'common/blockchain/transactions/pending-transactions/Pending-Transactions-List'

import InterfaceBlockchainTransactionFrom from './Interface-Blockchain-Transaction-From'
import InterfaceBlockchainTransactionTo from './Interface-Blockchain-Transaction-To'
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";

class InterfaceBlockchainTransaction{


    /**
     * Transaction Class enables to create a new Transaction
     * @param from  must be an Array[ object {address: object , publicKey: object } ]
     * @param to  must be an Array [ object {address: object , amount, currency } }
     * @param digitalSignature - using Elliptic Curve to digital sign the transaction
     * @param nonce - usually null
     * @param txId - usually null
     * @param pending
     *
     */

    constructor(from, to, digitalSignature, nonce, txId, pending){

        this.from = null;
        this.to = null;

        this.digitalSignature = digitalSignature
        this.txId = txId
        this.nonce = nonce;

        this.pending = pending||false;

        this._setTransactionAddressFrom(from);
        this._setTransactionAddressesTo(to);

        // Validate the validity of Funds
        this._validateTransaction()

        if (this.nonce === null) this._calculateNonce();

        if (!pending) {
            PendingTransactionsList.includePendingTransaction(this);
        }

    }

    _calculateNonce(){
        this.nonce = Math.floor(Math.random() * 1000000);
    }

    _calculateTransactionId(){
        this.txId = WebDollarCrypto.SHA256( this.toJSON(true, true) );
    }

    _setTransactionAddressFrom(from){

        from = InterfaceBlockchainTransactionFrom.validateFrom(from);

        //validate the ballance of from.address

        this.from = InterfaceBlockchainTransactionFrom(from.address, from.currency);
    }

    _setTransactionAddressesTo(to){

        to = InterfaceBlockchainTransactionTo.validateTo(to);

        //validate addresses

        this.to = InterfaceBlockchainTransactionTo(to.addresses, to.fee, to.currency );
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

    toJSON(dontIncludeTxId, dontIncludePending){

        let result = {
            from: this.from.toJSON(),
            to: this.to.toJSON(), //address,
            digitalSignature: this.digitalSignature,
            nonce: this.nonce,
        }

        if (!dontIncludeTxId ) result.txId = this.txId;
        if (!dontIncludePending ) result.pending = this.pending;

        return result;

    }

}

export default InterfaceBlockchainTransaction