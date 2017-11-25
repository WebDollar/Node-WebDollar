
import InterfaceValidateTransaction from 'common/blockchain/interface-blockchain/transactions/validate-transactions/Interface-Validate-Transaction'

class MiniBlockchainTransaction extends  InterfaceValidateTransaction{

    validate(from, to, amount, currency){


        InterfaceValidateTransaction.prototype.validate(this, from, to, amount, currency)

        //validate the data in the mini blockchain using the Accountant Radix Trie

    }


}

export default MiniBlockchainTransaction