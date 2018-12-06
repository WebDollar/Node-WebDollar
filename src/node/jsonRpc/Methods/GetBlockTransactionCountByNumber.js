import {Method} from './../../../jsonRpc'

/**
 * The number of transactions in a block matching the given block number.
 */
class GetBlockTransactionCountByNumber extends Method
{
    constructor(name, options = {}, oBlockFinder) {
        super(name, options);
        this._oBlockFinder      = oBlockFinder;
    }

    getHandler(args) {
        const oBlock = this._oBlockFinder.findByNumberOrTag(args[0]);

        if (oBlock === null)
        {
            return null;
        }

        return oBlock.data.transactions.transactions.length;
    }
}

export default GetBlockTransactionCountByNumber;
