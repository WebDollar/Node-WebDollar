import {RpcMethod} from './../../../jsonRpc';
import {isNumber} from 'lodash';

/**
 * The information about a transaction by block number and transaction index position.
 */
class GetTransactionByBlockNumberAndIndex extends RpcMethod
{
    constructor(name, oBlockFinder, oTransactionTransformer, oTransactionsPendingQueue) {
        super(name);

        this._oBlockFinder              = oBlockFinder;
        this._oTransactionTransformer   = oTransactionTransformer;
        this._oTransactionsPendingQueue = oTransactionsPendingQueue;
    }

    getHandler(args) {
        if (args.length !== 2)
        {
            throw new Error('Params must contain exactly two entries, the block number/TAG and the index of the transaction');
        }

        const nTransactionIndex = args[1];

        if (isNumber(nTransactionIndex) === false)
        {
            throw new Error('The index of the transaction must be a number');
        }

        if (args[0] === 'pending')
        {
            if (typeof this._oTransactionsPendingQueue.list[nTransactionIndex] === 'undefined')
            {
                return null;
            }

            return this._oTransactionTransformer.transform(this._oTransactionsPendingQueue.list[nTransactionIndex], null, nTransactionIndex);
        }

        const oBlock = this._oBlockFinder.findByNumberOrTag(args[0]);

        if (oBlock === null)
        {
            return null;
        }

        const oTransaction = oBlock.data.transactions.transactions[nTransactionIndex];

        if (typeof oTransaction === 'undefined')
        {
            return null;
        }

        return this._oTransactionTransformer.transform(oTransaction, oBlock, nTransactionIndex);
    }
}

export default GetTransactionByBlockNumberAndIndex;
