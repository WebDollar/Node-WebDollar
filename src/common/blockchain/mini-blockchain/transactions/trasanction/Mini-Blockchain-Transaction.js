import InterfaceBlockchainTransaction from 'common/blockchain/interface-blockchain/transactions/transaction/Interface-Blockchain-Transaction'

import MiniBlockchainTransactionFrom from './Mini-Blockchain-Transaction-From'
import MiniBlockchainTransactionTo from './Mini-Blockchain-Transaction-To'

const BigNumber = require('bignumber.js');

class MiniBlockchainTransaction extends  InterfaceBlockchainTransaction {

    _createTransactionFrom(from){
        return new MiniBlockchainTransactionFrom(this, from);
    }

    _createTransactionTo(to){
        return new MiniBlockchainTransactionTo(this, to);
    }

    processTransaction(multiplicationFactor = 1){

        this.blockchain.accountantTree.updateAccountNonce( this.from.addresses[0].unencodedAddress, multiplicationFactor );

        return InterfaceBlockchainTransaction.prototype.processTransaction.call(this, multiplicationFactor);
    }

    _validateNonce(){

        //Validate nonce
        let nonce = this.blockchain.accountantTree.getAccountNonce( this.from.addresses[0].unencodedAddress );

        if (nonce !== this.nonce)
            throw {message: "Nonce is invalid", myNonce: this.nonce, nonce: nonce }

        return true;

    }

    _computeNonce(){
        return this.blockchain.accountantTree.getAccountNonce( this.from.addresses[0].unencodedAddress );
    }

    processTransactionFees(multiplicationFactor=1, minerAddress = undefined){

        //validate amount
        let inputSum = this.from.calculateInputSum();
        let outputSum = this.to.calculateOutputSum();

        let diffInFees = inputSum.minus(outputSum);

        if (diffInFees instanceof BigNumber === false)
            throw {message: "diffInFees is not BigNumber",  address: minerAddress };

        if (diffInFees.isLessThan(0))
            throw {message: "Accountant Tree is negative" };

        try{

            let result = this.blockchain.accountantTree.updateAccount( minerAddress, diffInFees.multipliedBy(multiplicationFactor), this.from.currencyTokenId);

            if (result === null) throw {message: "Error Updating Account for Fees"};

        } catch (exception){
            console.error("processTransactionFees error ", exception)
        }

        return {fees: diffInFees, currencyTokenId: this.currencyTokenId};

    }

}

export default MiniBlockchainTransaction