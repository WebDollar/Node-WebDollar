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

        this.blockchain.accountantTree.updateAccountNonce( this.from.addresses[0].unencodedAddress, multiplicationFactor );

        return InterfaceBlockchainTransaction.prototype.processTransaction.call(this, multiplicationFactor);
    }

    _validateNonce(blockValidation){

        //Validate nonce
        let nonce = this.blockchain.accountantTree.getAccountNonce( this.from.addresses[0].unencodedAddress );

        if (nonce < this.nonce)
            if (blockValidation.blockValidationType !== undefined && blockValidation.blockValidationType['take-transactions-list-in-consideration'] !== undefined &&
                blockValidation.blockValidationType['take-transactions-list-in-consideration'].validation ){

                let foundNonce = {};
                for (let i=nonce; i<this.nonce; i++)
                    foundNonce[i] = false;

                //fetching the transactions list
                let transactionsList = blockValidation.blockValidationType['take-transactions-list-in-consideration'].transactions;

                if (transactionsList === undefined)
                    transactionsList = this.blockchain.transactions.pendingQueue.list;

                transactionsList.forEach((transaction)=>{

                    if (transaction.from.addresses[0].unencodedAddress.equals(this.from.addresses[0].unencodedAddress))
                        foundNonce[ transaction.nonce ] = true;

                });

                for (let i=nonce; i<this.nonce; i++)
                    if (!foundNonce[i])
                        return false;

                return true;

            }

        if (nonce !== this.nonce)
            throw {message: "Nonce is not right", myNonce: this.nonce, nonce: nonce };

        return true;

    }

    _computeNonce(){

        let nonce = this.blockchain.accountantTree.getAccountNonce( this.from.addresses[0].unencodedAddress );

        //calculate how many transactions we already have to increment the current nonce
        try {

            this.blockchain.transactions.pendingQueue.list.forEach((pendingTransaction) => {

                if (pendingTransaction.from.addresses[0].unencodedAddress.equals(this.from.addresses[0].unencodedAddress) && pendingTransaction.nonce >= nonce ) {
                    nonce++;
                }

            });

        } catch (exception){
            console.error("Error processing how many transactions we already have to increment the current nonce", exception);
        }

        return nonce;
    }

    processTransactionFees(multiplicationFactor=1, minerAddress = undefined){

        //validate amount
        let inputSum = this.from.calculateInputSum();
        let outputSum = this.to.calculateOutputSum();

        let diffInFees = inputSum - outputSum;

        if (typeof diffInFees !== 'number')
            throw {message: "diffInFees is not number",  address: minerAddress };

        if (diffInFees < 0)
            throw {message: "Accountant Tree is negative" };

        try{

            let result = this.blockchain.accountantTree.updateAccount( minerAddress, diffInFees * multiplicationFactor, this.from.currencyTokenId);

            if (result === null) throw {message: "Error Updating Account for Fees"};

        } catch (exception){
            console.error("processTransactionFees error ", exception)
        }

        return {fees: diffInFees, currencyTokenId: this.currencyTokenId};

    }

}

export default MiniBlockchainTransaction