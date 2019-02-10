import {RpcMethod} from './../../../jsonRpc';

/**
 * The number of transactions in a block from a block matching the given block hash.
 */
class GetBlockTransactionCountByHash extends RpcMethod
{
    /**
     * @param {string} name
     * @param {TransactionRepository} oTransactionRepository
     */
    constructor(name, oTransactionRepository) {
        super(name);

        this._oTransactionRepository = oTransactionRepository;
    }

    getHandler(args) {
        throw new Error('GetBlockTransactionCountByHash method is not supported');
        // if (args.length !== 1)
        // {
        //     throw new Error('Params must contain exactly one entry, the block hash');
        // }
        //
        // return this._oTransactionRepository.countByBlockHash(args[0]);
    }
}
export default GetBlockTransactionCountByHash;
