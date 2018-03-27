import InterfaceBlockchainTransactions from 'common/blockchain/interface-blockchain/transactions/Interface-Blockchain-Transactions'
import MiniBlockchainTransaction from "./trasanction/Mini-Blockchain-Transaction"

class MiniBlockchainTransactions extends InterfaceBlockchainTransactions {


    _createTransaction(from, to, nonce, timeLock, version, txId, validateFrom, validateTo){
        return new MiniBlockchainTransaction(this.blockchain, from, to, nonce, timeLock, version, txId, validateFrom, validateTo);
    }

    createTransactionFromBuffer(buffer, offset = 0){
        let transaction = new MiniBlockchainTransaction(this.blockchain, undefined, undefined, 0, 0xFFFFFFFF, 0x00, new Buffer(32), false, false );
        transaction.deserializeTransaction(buffer, offset);
        return transaction;
    }

}

export default MiniBlockchainTransactions;