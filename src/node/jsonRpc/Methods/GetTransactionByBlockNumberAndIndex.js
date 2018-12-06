import {Method} from './../../../jsonRpc'

/**
 * The information about a transaction by block number and transaction index position.
 */
class GetTransactionByBlockNumberAndIndex extends Method
{
    constructor(name, options = {}, oBlockFinder, oTransactionTransformer) {
        super(name, options);

        this._oBlockFinder            = oBlockFinder;
        this._oTransactionTransformer = oTransactionTransformer;
    }

    getHandler(args) {
        const oBlock = this._oBlockFinder.findByNumberOrTag(args[0]);

        if (oBlock === null)
        {
            return null;
        }

        const nTransactionIndex = args[1];
        const oTransaction      = oBlock.data.transactions.transactions[nTransactionIndex];

        if (typeof oTransaction === 'undefined')
        {
            return null;
        }

        return this._oTransactionTransformer.transform(oTransaction, oBlock, nTransactionIndex);
    }
}

export default GetTransactionByBlockNumberAndIndex;
