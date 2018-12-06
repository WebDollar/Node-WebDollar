import {RpcMethod} from './../../../jsonRpc';

/**
 * The number of transactions in a block matching the given block number.
 */
class GetBlockTransactionCountByNumber extends RpcMethod
{
    constructor(name, oBlockFinder, oTransactionsPendingQueue) {
        super(name);
        this._oBlockFinder              = oBlockFinder;
        this._oTransactionsPendingQueue = oTransactionsPendingQueue;
    }

    getHandler(args) {
        if (args.length !== 1)
        {
            throw new Error('Params must contain exactly one entry, the block number/TAG');
        }

        if (args[0] === 'pending')
        {
            return this._oTransactionsPendingQueue.list.length;
        }

        const oBlock = this._oBlockFinder.findByNumberOrTag(args[0]);

        if (oBlock === null)
        {
            return null;
        }

        return oBlock.data.transactions.transactions.length;
    }
}

export default GetBlockTransactionCountByNumber;
