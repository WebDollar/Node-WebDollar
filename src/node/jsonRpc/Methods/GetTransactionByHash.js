import {RpcMethod} from './../../../jsonRpc';

/**
 * The information about a transaction requested by transaction hash.
 */
class GetTransactionByHash extends RpcMethod
{
    constructor(name, oTransactionRepository, oTransactionTransformer) {
        super(name);

        this._oTransactionRepository  = oTransactionRepository;
        this._oTransactionTransformer = oTransactionTransformer;
    }

    async getHandler(args) {
        if (args.length !== 1) {
            throw new Error('Params must contain exactly one entry, the transaction hash');
        }

        const oTransaction = await this._oTransactionRepository.findByHash(args[0]);

        if (oTransaction === null) {
            return null;
        }

        return this._oTransactionTransformer.transform(oTransaction, oTransaction.__oBlock, oTransaction.__nIndex);
    }
}

export default GetTransactionByHash;
