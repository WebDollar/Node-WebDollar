import InterfaceBlockchainTransaction from 'common/blockchain/interface-blockchain/transactions/transaction/Interface-Blockchain-Transaction'

import MiniBlockchainTransactionFrom from './Mini-Blockchain-Transaction-From'
import MiniBlockchainTransactionTo from './Mini-Blockchain-Transaction-To'

class MiniBlockchainTransaction extends  InterfaceBlockchainTransaction {

    _createTransactionFrom(from){
        return new MiniBlockchainTransactionFrom(this, from);
    }

    _createTransactionTo(to){
        return new MiniBlockchainTransactionTo(this, to);
    }

    processTransaction(multiplicationFactor = 1){

        this.blockchain.accountantTree.getAccountNonce( this.from.addresses[0].unencodedAddress, multiplicationFactor );

        return InterfaceBlockchainTransaction.prototype.processTransaction.call(this);
    }

    _validateNonce(){
        return this.nonce === this.blockchain.accountantTree.getAccountNonce( this.from.addresses[0].unencodedAddress ) ;
    }

}

export default MiniBlockchainTransaction