import InterfaceBlockchainTransaction from 'common/blockchain/interface-blockchain/transactions/transaction/Interface-Blockchain-Transaction'
import consts from 'consts/const_global'

import MiniBlockchainTransactionFrom from './Mini-Blockchain-Transaction-From'
import MiniBlockchainTransactionTo from './Mini-Blockchain-Transaction-To'
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"
import BufferExtended from "common/utils/BufferExtended";

class MiniBlockchainTransaction extends  InterfaceBlockchainTransaction {

    _createTransactionFrom(from){
        return new MiniBlockchainTransactionFrom(this, from);
    }

    _createTransactionTo(to){
        return new MiniBlockchainTransactionTo(this, to);
    }

    _preProcessTransaction(multiplicationFactor = 1 ,  revertActions, showUpdate){

        this.blockchain.accountantTree.updateAccountNonce(this.from.addresses[0].unencodedAddress, multiplicationFactor, revertActions, showUpdate);

        return true;

    }

    _validateNonce( blockValidationType ){

        //Nonce from the accountant Tree
        let nonce = this.blockchain.accountantTree.getAccountNonce( this.from.addresses[0].unencodedAddress );

        if (nonce < this.nonce)
            if (blockValidationType !== undefined && blockValidationType['take-transactions-list-in-consideration'] !== undefined && blockValidationType['take-transactions-list-in-consideration'].validation ){

                let foundNonce = {};
                for (let i=nonce; i<this.nonce; i++)
                    foundNonce[i] = false;

                //fetching the transactions list
                let transactionsList = blockValidationType['take-transactions-list-in-consideration'].transactions;

                if (transactionsList === undefined)
                    transactionsList = this.blockchain.transactions.pendingQueue.listArray;

                transactionsList.forEach( (transaction)=>{

                    if ( transaction.from.addresses[0].unencodedAddress.equals( this.from.addresses[0].unencodedAddress ))
                        foundNonce[ transaction.nonce ] = true;

                });

                for (let i=nonce; i<this.nonce; i++)
                    if (!foundNonce[i])
                        throw {message: "Nonce is not right 2", myNonce: this.nonce, nonce: nonce, txId: this.txId.toString("hex") };

                return true;

            }

        if (nonce !== this.nonce) {
            console.error ( {message: "Nonce is not right", myNonce: this.nonce, nonce: nonce, txId: this.txId.toString("hex") } );
            //throw {message: "Nonce is not right", myNonce: this.nonce, nonce: nonce, txId: this.txId.toString("hex")};
            throw "Nonce is not right";
        }

        return true;

    }

    _computeNonce(){

        let nonce = this.blockchain.accountantTree.getAccountNonce( this.from.addresses[0].unencodedAddress );

        //calculate how many transactions we already have to increment the current nonce
        try {

            this.blockchain.transactions.pendingQueue.listArray.forEach( (pendingTransaction) => {

                if ( BufferExtended.safeCompare(pendingTransaction.from.addresses[0].unencodedAddress, this.from.addresses[0].unencodedAddress) && pendingTransaction.nonce > nonce ) {

                    //Compute only consecutive nonces
                    if( pendingTransaction.nonce - nonce === 1 )
                        nonce++;

                }

            });

        } catch (exception){
            console.error("Error processing how many transactions we already have to increment the current nonce", exception);
        }

        return nonce;
    }

    _processTransactionFees(multiplicationFactor=1, minerAddress = undefined, revertActions, showUpdate){

        //validate amount
        let inputSum = this.from.calculateInputSum();
        let outputSum = this.to.calculateOutputSum();

        let diffInFees = inputSum - outputSum;

        if (! WebDollarCoins.validateCoinsNumber( diffInFees ) )
            throw {message: "diffInFees is not number",  address: minerAddress };

        if (diffInFees < 0)
            throw {message: "Accountant Tree is negative" };


        this.blockchain.accountantTree.updateAccount( minerAddress, diffInFees * multiplicationFactor, this.from.currencyTokenId, revertActions, showUpdate);

        return {fees: diffInFees, currencyTokenId: this.currencyTokenId};

    }

}

export default MiniBlockchainTransaction