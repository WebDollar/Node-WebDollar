import InterfaceBlockchainTransactionFrom from 'common/blockchain/interface-blockchain/transactions/transaction/Interface-Blockchain-Transaction-From'
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"
import BufferExtended from "common/utils/BufferExtended";

class MiniBlockchainTransactionFrom extends InterfaceBlockchainTransactionFrom{


    validateFromEnoughMoney(blockValidationType){

        let amounts = {};
        if (blockValidationType !== undefined && blockValidationType['take-transactions-list-in-consideration'] !== undefined &&  blockValidationType['take-transactions-list-in-consideration'].validation ){

            //fetching the transactions list
            let transactionsList = blockValidationType['take-transactions-list-in-consideration'].transactions;

            if (transactionsList === undefined)
                transactionsList = this.transaction.blockchain.transactions.pendingQueue.listArray;

            for (let i=0; i < transactionsList.length; i++){

                let transaction = transactionsList[i];

                if (BufferExtended.safeCompare(this.transaction.txId, transaction.txId))
                    return false; // transaction is not taken in consideration

                transaction.from.addresses.forEach((address)=>{

                    let addr = address.unencodedAddress.toString("hex");

                    if (amounts[addr] === undefined) amounts[addr] = 0;

                    amounts[addr] -= address.amount;

                });

                transaction.to.addresses.forEach((address)=>{

                    let addr = address.unencodedAddress.toString("hex");

                    if (amounts[addr] === undefined) amounts[addr] = 0;

                    amounts[addr] += address.amount;

                });


            }

        }

        this.addresses.forEach ( (fromObject, index) =>{

            let value = this.transaction.blockchain.accountantTree.getBalance( fromObject.unencodedAddress, this.currencyTokenId );
            if (value === null) value = 0;

            //simulation the transactions

            if (blockValidationType !== undefined && blockValidationType['take-transactions-list-in-consideration'] !== undefined && blockValidationType['take-transactions-list-in-consideration'].validation ){

                let addr = fromObject.unencodedAddress.toString("hex");

                if (amounts[addr] !== undefined)
                    value += amounts[addr];

            }

            if (value < 0) throw {message: "Accountant Tree Input doesn't exist", unencodedAddress: fromObject.unencodedAddress}

            if (value < fromObject.amount)
                throw { message: "Value is Less than From.address.amount", address: fromObject, index: index };

        });

        return true;
    }


    processTransactionFrom(multiplicationFactor = 1, revertActions, showUpdate){

        for (let i = 0; i < this.addresses.length; i++) {

            if (!WebDollarCoins.validateCoinsNumber(this.addresses[i].amount))
                throw {message: "amount is not number",  address: this.addresses[i]};

            this.transaction.blockchain.accountantTree.updateAccount( this.addresses[i].unencodedAddress, - this.addresses[i].amount * multiplicationFactor, this.currencyTokenId, revertActions, showUpdate);

        }

        return true;

    }


}

export default MiniBlockchainTransactionFrom