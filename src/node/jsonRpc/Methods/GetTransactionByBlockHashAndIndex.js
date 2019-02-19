import {RpcMethod} from './../../../jsonRpc';
import {isInteger} from 'lodash';

/**
 * The information about a transaction by block hash and transaction index position.
 */
class GetTransactionByBlockHashAndIndex extends RpcMethod
{
    /**
     * @param {string} name
     * @param {BlockRepository}        oBlockRepository
     * @param {TransactionRepository}  oTransactionRepository
     * @param {TransactionTransformer} oTransactionTransformer
     */
    constructor(name, oBlockRepository, oTransactionRepository, oTransactionTransformer) {
        super(name);

        this._oBlockRepository        = oBlockRepository;
        this._oTransactionRepository  = oTransactionRepository;
        this._oTransactionTransformer = oTransactionTransformer;
    }

    async getHandler(args) {
        if (args.length !== 2) {
            throw new Error('Params must contain exactly two entries, the block hash and the index of the transaction');
        }

        const nTransactionIndex = args[1];

        if (isInteger(nTransactionIndex) === false || nTransactionIndex < 0) {
            throw new Error('The index of the transaction must be a number greater than 0');
        }

        const oTransaction = await this._oTransactionRepository.findByBlockHashAndIndex(args[0], nTransactionIndex);

        if (oTransaction === null) {
            return null;
        }

        return this._oTransactionTransformer.transform(oTransaction, oTransaction.__oBlock, nTransactionIndex);
    }
}

export default GetTransactionByBlockHashAndIndex;
