import {RpcMethod} from './../../../jsonRpc';

/**
 * The number of transactions in a block matching the given block number.
 */
class GetBlockTransactionCountByNumber extends RpcMethod {
    /**
     * @param {string} name
     * @param {TransactionRepository} oTransactionRepository
     */
    constructor(name, oTransactionRepository) {
        super(name);
        this._oTransactionRepository = oTransactionRepository;
    }

    getHandler(args) {
        if (args.length !== 1) {
            throw new Error('Params must contain exactly one entry, the block number/TAG');
        }

        return this._oTransactionRepository.countByBlockNumber(args[0]);
    }
}

export default GetBlockTransactionCountByNumber;
