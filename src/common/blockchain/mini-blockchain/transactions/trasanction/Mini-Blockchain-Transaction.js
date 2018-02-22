
import InterfaceBlockchainTransaction from 'common/blockchain/interface-blockchain/transactions/transaction/Interface-Blockchain-Transaction'

class MiniBlockchainTransaction extends  InterfaceBlockchainTransaction{

    validateTransaction(){

        let result = InterfaceBlockchainTransaction.prototype.validateTransaction.call(this);

        if (!result)
            return result;

        //check balance in accountant tree

    }

}

export default MiniBlockchainTransaction