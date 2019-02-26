import {isInteger, isEmpty, isString} from 'lodash';
import BlockDataHardForksProcessor    from './BlockDataHardForksProcessor';

/**
 * Repository for Transactions
 */
class TransactionRepository {
    /**
     * @param {BlockRepository}          oBlockRepository
     * @param {TransactionsPendingQueue} oPendingQueueTransactionsManager
     * @param {MainBlockchain}           oBlockchain
     */
    constructor(oBlockRepository, oPendingQueueTransactionsManager, oBlockchain) {
        this._oBlockRepository                 = oBlockRepository;
        this._oPendingQueueTransactionsManager = oPendingQueueTransactionsManager;
        this._oBlockchain                      = oBlockchain;
    }

    /**
     * @param {string|int} mBlockNumber
     * @param {int} nIndex
     * @return {InterfaceBlockchainTransaction|null}
     */
    async findByBlockNumberAndIndex(mBlockNumber, nIndex = 0) {
        if (isInteger(nIndex) === false || nIndex < 0) {
            return null;
        }

        if (mBlockNumber === 'pending') {
            const oTransaction = this._oPendingQueueTransactionsManager.listArray[nIndex];
            return typeof oTransaction === 'undefined' ? null : oTransaction;
        }

        const oBlock = await this._oBlockRepository.findByNumberOrTag(mBlockNumber);

        if (oBlock === null) {
            return null;
        }

        const oTransaction = oBlock.data.transactions.transactions[nIndex];

        if (typeof oTransaction === 'undefined') {
            return null;
        }

        oTransaction.__nIndex = nIndex;
        oTransaction.__oBlock = oBlock;

        return oTransaction;
    }

    async findByBlockHashAndIndex(sBlockHash, nIndex = 0) {
        if (isString(sBlockHash) === false || isEmpty(sBlockHash) || isInteger(nIndex) === false || nIndex < 0) {
            return null;
        }

        const oBlock = await this._oBlockRepository.findByHash(sBlockHash);

        if (oBlock === null) {
            return null;
        }

        const oTransaction = oBlock.data.transactions.transactions[nIndex];

        if (typeof oTransaction === 'undefined') {
            return null;
        }

        oTransaction.__nIndex = nIndex;
        oTransaction.__oBlock = oBlock;

        return oTransaction;
    }

    async findByHash(sTransactionHash) {
        if (isString(sTransactionHash) === false || isEmpty(sTransactionHash)) {
            return null;
        }

        let oTransaction = null;

        oTransaction = this._oPendingQueueTransactionsManager.listArray.find((oTransaction) => {
            return oTransaction.txId.toString('hex') === sTransactionHash;
        });

        // find will return undefined in case the element is not found
        if (typeof oTransaction !== 'undefined') {
            oTransaction.__nIndex = null;
            oTransaction.__oBlock = null;
            return oTransaction;
        }

        const nBlockNumber = await this.findBlockNumberForHash(sTransactionHash);

        if (nBlockNumber === null) {
            return null;
        }

        const oBlock = await this._oBlockRepository.findByNumberOrTag(nBlockNumber);

        if (oBlock === null) {
            return null;
        }

        oBlock.data.transactions.transactions.forEach((oBlockTransaction, nTransactionIndex) => {
            if (oBlockTransaction.txId.toString('hex') === sTransactionHash) {
                // Add some virtual properties to prevent another searches/loadings
                oTransaction          = oBlockTransaction;
                oTransaction.__nIndex = nTransactionIndex;
                oTransaction.__oBlock = oBlock;
            }
        });

        return oTransaction;
    }

    async findBlockNumberForHash(sTransactionHash) {
        if (isString(sTransactionHash) === false || isEmpty(sTransactionHash)) {
            return null;
        }

        let nBlockNumber = BlockDataHardForksProcessor.findBlockNumberForTransactionHash(sTransactionHash);

        if (nBlockNumber !== null) {
            return nBlockNumber;
        }

        const self = this;

        try {
            return await self._oBlockchain.db.get('transactionID-' + sTransactionHash);
        }
        catch (e) {
            return null;
        }
    }

    /**
     * @param {string|int} mBlockNumber
     * @return {int}
     */
    async countByBlockNumber(mBlockNumber) {
        if (mBlockNumber === 'pending') {
            return this._oPendingQueueTransactionsManager.listArray.length;
        }

        const oBlock = await this._oBlockRepository.findByNumberOrTag(mBlockNumber);

        if (oBlock === null) {
            return 0;
        }

        return oBlock.data.transactions.transactions.length;
    }

    /**
     * @param {string} sBlockHash
     * @return {int}
     */
    async countByBlockHash(sBlockHash) {
        const oBlock = await this._oBlockRepository.findByHash(sBlockHash);

        if (oBlock === null) {
            return 0;
        }

        return oBlock.data.transactions.transactions.length;
    }
}

export default TransactionRepository;
