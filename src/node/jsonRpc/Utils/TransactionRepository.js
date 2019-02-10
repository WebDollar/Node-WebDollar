import {isInteger, isEmpty, isString} from 'lodash';

/**
 * Repository for Transactions
 */
class TransactionRepository {
    /**
     * @param {BlockRepository}          oBlockRepository
     * @param {TransactionsPendingQueue} oPendingQueueTransactionsManager
     */
    constructor(oBlockRepository, oPendingQueueTransactionsManager) {
        this._oBlockRepository                 = oBlockRepository;
        this._oPendingQueueTransactionsManager = oPendingQueueTransactionsManager;
    }

    /**
     * @param {string|int} mBlockNumber
     * @param {int} nIndex
     * @return {InterfaceBlockchainTransaction|null}
     */
    findByBlockNumberAndIndex(mBlockNumber, nIndex = 0) {
        if (isInteger(nIndex) === false || nIndex < 0) {
            return null;
        }

        if (mBlockNumber === 'pending') {
            const oTransaction = this._oPendingQueueTransactionsManager.listArray[nIndex];
            return typeof oTransaction === 'undefined' ? null : oTransaction;
        }

        const oBlock = this._oBlockRepository.findByNumberOrTag(mBlockNumber);

        if (oBlock === null) {
            return null;
        }

        const oTransaction = oBlock.data.transactions.transactions[nIndex];
        return typeof oTransaction === 'undefined' ? null : oTransaction;
    }

    findByBlockHashAndIndex(sBlockHash, nIndex = 0) {
        if (isString(sBlockHash) === false || isEmpty(sBlockHash) || isInteger(nIndex) === false || nIndex < 0) {
            return null;
        }

        const oBlock = this._oBlockRepository.findByHash(sBlockHash);

        if (oBlock === null) {
            return null;
        }

        const oTransaction = oBlock.data.transactions.transactions[nIndex];
        return typeof oTransaction === 'undefined' ? null : oTransaction;
    }

    /**
     * @param {string|int} mBlockNumber
     * @return {int}
     */
    countByBlockNumber(mBlockNumber) {
        if (mBlockNumber === 'pending') {
            return this._oPendingQueueTransactionsManager.listArray.length;
        }

        const oBlock = this._oBlockRepository.findByNumberOrTag(mBlockNumber);

        if (oBlock === null) {
            return 0;
        }

        return oBlock.data.transactions.transactions.length;
    }

    /**
     * @param {string} sBlockHash
     * @return {int}
     */
    countByBlockHash(sBlockHash) {
        const oBlock = this._oBlockRepository.findByHash(sBlockHash);

        if (oBlock === null) {
            return 0;
        }

        return oBlock.data.transactions.transactions.length;
    }
}

export default TransactionRepository;
