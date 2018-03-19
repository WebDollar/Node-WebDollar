import InterfaceBlockchainTransactions from 'common/blockchain/interface-blockchain/transactions/Interface-Blockchain-Transactions'
import MiniBlockchainTransaction from "./trasanction/Mini-Blockchain-Transaction"

class MiniBlockchainTransactions extends InterfaceBlockchainTransactions {

    _createTransaction(from, to, nonce, txId, validateFrom, validateTo){
        return new MiniBlockchainTransaction(this.blockchain, from, to, nonce, txId, validateFrom, validateTo);
    }

}

export default MiniBlockchainTransactions;