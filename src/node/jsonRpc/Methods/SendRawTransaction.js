import {authenticatedMethod, RpcMethod} from './../../../jsonRpc';
import atob from 'atob';

/**
 * Creates a new transaction for pre-signed transactions.
 */
class SendRawTransaction extends RpcMethod
{
    constructor(name, oTransactionsManager, oSyncing) {
        super(name);

        this._oTransactionsManager = oTransactionsManager;
        this._oSyncing             = oSyncing;
    }

    async getHandler(args) {
        if (args.length !== 1)
        {
            throw new Error('Params must contain exactly one entry');
        }

        const oSyncingStatus = this._oSyncing.getHandler();

        if (oSyncingStatus.isSynchronized === false)
        {
            throw new Error('Cannot send transaction while node is not in sync');
        }

        //@TODO Check if this is the correct way of propagating a raw transaction
        try
        {
            const data = JSON.parse(atob(args[0]));

            const oTransaction = await this._oTransactionsManager.wizard.deserializeValidateTransaction(data.transaction);
            const answer       = await this._oTransactionsManager.wizard.propagateTransaction(data.signature, oTransaction);

            if (answer.result === true)
            {
                return oTransaction._computeTxId().toString('hex');
            }
        }
        catch (e) {
            throw new Error('Transaction not accepted. ' + e.message);
        }
    }
}

export default authenticatedMethod(SendRawTransaction);
