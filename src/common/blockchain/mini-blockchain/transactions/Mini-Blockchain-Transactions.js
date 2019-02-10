import InterfaceBlockchainTransactions from 'common/blockchain/interface-blockchain/transactions/Interface-Blockchain-Transactions'
import MiniBlockchainTransaction from "./trasanction/Mini-Blockchain-Transaction"

class MiniBlockchainTransactions extends InterfaceBlockchainTransactions {


    _createTransaction(from, to, nonce, timeLock, version, txId, validateFrom, validateTo, validateNonce,validateTimeLock, validateVersion, validateTxId ){
        return new MiniBlockchainTransaction(this.blockchain, from, to, nonce, timeLock, version, txId, validateFrom, validateTo, validateNonce,validateTimeLock, validateVersion, validateTxId);
    }

}

export default MiniBlockchainTransactions;