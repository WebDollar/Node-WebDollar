import InterfaceBlockchainTransaction from 'common/blockchain/interface-blockchain/transactions/transaction/Interface-Blockchain-Transaction'

import MiniBlockchainTransactionFrom from './Mini-Blockchain-Transaction-From'
import MiniBlockchainTransactionTo from './Mini-Blockchain-Transaction-To'

class MiniBlockchainTransaction extends  InterfaceBlockchainTransaction{

    _createTransactionFrom(from){
        return new MiniBlockchainTransactionFrom(this, from);
    }

    _createTransactionTo(to){
        return new MiniBlockchainTransactionTo(this, to);
    }

}

export default MiniBlockchainTransaction