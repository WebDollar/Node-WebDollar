import {isInteger} from 'lodash';
import {RpcMethod} from './../../../jsonRpc';

/**
 * The information about a transaction by block number and transaction index position.
 */
class GetTransactionByBlockNumberAndIndex extends RpcMethod {
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

    getHandler(args) {
        if (args.length !== 2) {
            throw new Error('Params must contain exactly two entries, the block number/TAG and the index of the transaction');
        }

        const nTransactionIndex = args[1];

        if (isInteger(nTransactionIndex) === false || nTransactionIndex < 0) {
            throw new Error('The index of the transaction must be a number greater than 0');
        }

        const oBlock       = this._oBlockRepository.findByNumberOrTag(args[0]);
        const oTransaction = this._oTransactionRepository.findByBlockNumberAndIndex(args[0], nTransactionIndex);

        if (oTransaction === null) {
            return null;
        }

        return this._oTransactionTransformer.transform(oTransaction, oBlock, nTransactionIndex);
    }
}

export default GetTransactionByBlockNumberAndIndex;
