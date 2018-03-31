import InterfaceBlockchainTransactionFrom from 'common/blockchain/interface-blockchain/transactions/transaction/Interface-Blockchain-Transaction-From'

const BigNumber = require('bignumber.js');

class MiniBlockchainTransactionFrom extends InterfaceBlockchainTransactionFrom{


    validateFromEnoughMoney(blockValidation){

        let amounts = {};
        if (blockValidation.blockValidationType !== undefined && blockValidation.blockValidationType['take-transactions-list-in-consideration'] !== undefined &&
            blockValidation.blockValidationType['take-transactions-list-in-consideration'].validation ){

            //fetching the transactions list
            let transactionsList = blockValidation.blockValidationType['take-transactions-list-in-consideration'].transactions;

            if (transactionsList === undefined)
                transactionsList = this.transaction.blockchain.transactions.pendingQueue.list;

            transactionsList.forEach((transaction)=>{

                if (this.transaction.txId.equals(transaction.txId))
                    return false; // transaction is not taken in consideration

                transaction.from.addresses.forEach((address)=>{

                    let addr = address.unencodedAddress.toString("hex");

                    if (amounts[addr] === undefined) amounts[addr] = BigNumber(0);

                    amounts[addr] = amounts[addr].minus(address.amount);

                });

                transaction.to.addresses.forEach((address)=>{

                    let addr = address.unencodedAddress.toString("hex");

                    if (amounts[addr] === undefined) amounts[addr] = BigNumber(0);

                    amounts[addr] = amounts[addr].plus(address.amount);

                });

            });

        }



        this.addresses.forEach ( (fromObject, index) =>{

            let value = this.transaction.blockchain.accountantTree.getBalance( fromObject.unencodedAddress, this.currencyTokenId );
            if (value === null) value = new BigNumber(0);

            //simulation the transactions

            if (blockValidation.blockValidationType !== undefined && blockValidation.blockValidationType['take-transactions-list-in-consideration'] !== undefined &&
                blockValidation.blockValidationType['take-transactions-list-in-consideration'].validation ){

                let addr = fromObject.unencodedAddress.toString("hex");

                if (amounts[addr] !== undefined)
                    value = value.plus ( amounts[addr] );

            }

            if (value.isLessThan(0)) throw {message: "Accountant Tree Input doesn't exist", unencodedAddress: fromObject.unencodedAddress}

            if (value.isLessThan(fromObject.amount))
                throw { message: "Value is Less than From.address.amount", address: fromObject, index: index };

        });

        return true;
    }


    processTransactionFrom(multiplicationFactor=1){

        let lastPosition;

        try {

            for (let i = 0; i < this.addresses.length; i++) {

                if (this.addresses[i].amount instanceof BigNumber === false) throw {message: "amount is not BigNumber",  address: this.addresses[i]};

                let result = this.transaction.blockchain.accountantTree.updateAccount( this.addresses[i].unencodedAddress, this.addresses[i].amount.multipliedBy(multiplicationFactor).negated(), this.currencyTokenId);

                if (result === null) throw {message: "error Updating Account", address: this.addresses[i]};

            }

        } catch (exception){

            for (let i=lastPosition; i >= 0 ; i--) {
                let result = this.transaction.blockchain.accountantTree.updateAccount(this.addresses[i].unencodedAddress, this.addresses[i].amount.multipliedBy(multiplicationFactor), this.currencyTokenId);

                if (result === null) throw {message: "error Updating Account", address: this.addresses[i]};
            }

        }

    }


}

export default MiniBlockchainTransactionFrom