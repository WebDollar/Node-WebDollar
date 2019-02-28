import BufferExtended  from './../../../utils/BufferExtended';
import WebDollarCrypto from './../../../crypto/WebDollar-Crypto';
import const_global    from './../../../../consts/const_global';
import Serialization   from './../../../utils/Serialization';
import Blockchain      from './../../../../main-blockchain/Blockchain';
import Log             from './../../../utils/logging/Log';

class InterfaceBlockchainBlockDataTransactions {

    constructor(blockData, transactions, hashTransactions, db) {

        this.blockData    = blockData;
        this.db           = db;
        this.transactions = transactions || [];

        if ( !hashTransactions )
            hashTransactions = this.calculateHashTransactions();

        this.hashTransactions = hashTransactions;
    }

    async saveVirtualizedTxId(txId, blockHeight) {

        if (Buffer.isBuffer(txId) ) txId = txId.toString("hex");

        try {
            return this.db.save('transactionID-' + txId, blockHeight);
        }
        catch (err) {
            console.error( 'ERROR on saving TxId: ' + txId, err);
        }
    }

    async deleteVirtualizedTxId(txId) {

        if (Buffer.isBuffer(txId) ) txId = txId.toString("hex");

        try {
            return  this.db.remove('transactionID-' + txId);
        }
        catch (err) {
            console.error( 'ERROR deleting TxId: ' + txId, err);
        }

    }

    async confirmTransactions(blockHeight, save = false) {

        await this.transactions.forEach(async transaction => {

            if (save)
                await this.saveVirtualizedTxId(transaction.txId.toString('hex'), blockHeight);

            transaction.confirmed = true;
        });

    }

    async unconfirmTransactions() {

        await this.transactions.forEach(async transaction => {

            transaction.confirmed = false;

            try {

                await this.deleteVirtualizedTxId(transaction.txId.toString('hex'));
                await this.blockData.blockchain.transactions.pendingQueue.includePendingTransaction(transaction, 'all');

            }
            catch (exception) {
                Log.warn('Transaction Was Rejected to be Added to the Pending Queue ', Log.LOG_TYPE.BLOCKCHAIN_FORKS, transaction.toJSON());
                console.error(exception);
            }

        });
    }

    async validateTransactions(blockHeight, blockValidationType) {
        let hashTransactions = this.calculateHashTransactions();

        if (! BufferExtended.safeCompare(this.hashTransactions, hashTransactions)) {
            throw {message: 'hash transaction is invalid at', hashTransactionsOriginal: this.hashTransactions, hashTransactions: hashTransactions};
        }

        for (let i=0; i<this.transactions.length; i++) {

            if (typeof blockValidationType === 'undefined') {
                blockValidationType = {};
            }

            blockValidationType['take-transactions-list-in-consideration'] = {
                validation  : true,
                transactions: this.transactions.slice(0, i),
            };

            if (!this.transactions[i].validateTransactionOnce(blockHeight, blockValidationType)) {
                throw {message: 'validation failed at transaction', transaction: this.transactions[i]};
            }

            if (!blockValidationType['skip-sleep']) {
                await Blockchain.blockchain.sleep(2);
            }
        }

        if (!this.validateDuplicateTransactions()) {
            return {message: 'validateDuplicateTransactions failed'};
        }

        return true;
    }

    validateDuplicateTransactions() {

        let fromAddresses = {};
        let toAddresses   = {};

        for (let i=0; i<this.transactions.length; i++) {
            let transaction = this.transactions[i];

            transaction.from.addresses.forEach((fromAddress) => {
                let address = fromAddress.unencodedAddress.toString('hex');
                fromAddresses[address]++;

                if (fromAddresses[address] > const_global.SPAM_GUARDIAN.TRANSACTIONS.MAXIMUM_IDENTICAL_INPUTS) {
                    throw {message: 'spam guardian detected many identical inputs'};
                }
            });

            transaction.to.addresses.forEach((toAddress) => {
                let address = toAddress.unencodedAddress.toString('hex');
                toAddresses[address]++;

                if (toAddresses[address] > const_global.SPAM_GUARDIAN.TRANSACTIONS.MAXIMUM_IDENTICAL_OUTPUTS) {
                    throw {message: 'spam guardian detected many identical inputs'};
                }
            });
        }

        return true;
    }

    calculateHashTransactions () {
        if (this.blockData._onlyHeader) {
            return this.hashTransactions;
        }
        else {
            return WebDollarCrypto.SHA256(WebDollarCrypto.SHA256(this._computeBlockDataTransactionsConcatenate()));
        }
    }

    _computeBlockDataTransactionsConcatenate() {

        let bufferList = [];

        for (let i = 0; i < this.transactions.length; i++) {
            bufferList.push(this.transactions[i].serializeTransaction());
        }

        return Buffer.concat(bufferList);
    }

    serializeTransactions(onlyHeader = false) {
        let list = [
            Serialization.serializeToFixedBuffer(32, this.hashTransactions)
        ];

        if (!onlyHeader && !this.blockData._onlyHeader) {
            list.push(Serialization.serializeNumber4Bytes(this.transactions.length));

            for (let i = 0; i < this.transactions.length; i++) {
                list.push(this.transactions[i].serializeTransaction());
            }
        }

        return Buffer.concat(list);
    }

    deserializeTransactions(buffer, offset, onlyHeader = false) {
        this.hashTransactions = BufferExtended.substr(buffer, offset, 32);
        offset += 32;

        if (!onlyHeader && !this.blockData._onlyHeader) {
            let length = Serialization.deserializeNumber4Bytes(buffer, offset); //TODO change  2 elements
            offset += 4;

            for (let i=0; i<length; i++) {

                let answer      = this.blockData.blockchain.transactions._createTransactionFromBuffer(buffer, offset);
                let transaction = answer.transaction;
                offset          = answer.offset;

                this.transactions.push(transaction);
            }

            this.transactionsLoaded = true;
        }

        return offset;
    }

    _processBlockDataTransaction(blockHeight, transaction, multiplicationFactor = 1 , minerAddress = undefined, revertActions = undefined, showUpdate) {

        //skipping checking the Transaction in case it requires reverting
        if (multiplicationFactor === 1) {
            if (!transaction.validateTransactionOnce(blockHeight)) {
                throw {message: 'couldn\'t process the transaction ', transaction: transaction.txId };
            }
        }

        transaction.processTransaction(multiplicationFactor, minerAddress, revertActions, showUpdate);

        return true;
    }

    processBlockDataTransactions(block, multiplicationFactor = 1, revertActions, showUpdate) {
        for (let i=0; i<block.data.transactions.transactions.length; i++) {
            if (! this._processBlockDataTransaction(block.height, block.data.transactions.transactions[i], multiplicationFactor, block.data.minerAddress, revertActions, showUpdate)) {
                return false;
            }
        }

        return true;
    }

    calculateFees() {
        let fee = 0;

        for (let i=0; i < this.transactions.length; i++) {
            fee += this.transactions[i].fee;
        }

        return fee;
    }

    findTransactionInBlockData(transaction) {
        if (typeof transaction === 'string') {
            transaction = Buffer.from(transaction, 'hex');
        }

        if (!Buffer.isBuffer(transaction) && typeof transaction === 'object') {
            transaction = transaction.txId;
        }

        for (let i=0; i <this.transactions.length; i++) {
            if (this.transactions[i].txId.equals(transaction)) {
                return i;
            }
        }

        return -1;
    }
}

export default InterfaceBlockchainBlockDataTransactions;
