import InterfaceBlockchainTransactionTo from 'common/blockchain/interface-blockchain/transactions/transaction/Interface-Blockchain-Transaction-To'
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"

class MiniBlockchainTransactionTo extends InterfaceBlockchainTransactionTo {

    processTransactionTo(multiplicationFactor=1){

        let lastPosition;

        try {

            for (let i = 0; i < this.addresses.length; i++) {

                if (!WebDollarCoins.validateCoinsNumber(this.addresses[i].amount))
                    throw {message: "Amount is not a number", address: this.addresses[i]};

                let result = this.transaction.blockchain.accountantTree.updateAccount(this.addresses[i].unencodedAddress, this.addresses[i].amount.multipliedBy(multiplicationFactor), this.transaction.from.currencyTokenId);

                if (result === null) throw {message: "error Updating Account", address: this.addresses[i]}

                lastPosition = i;
            }

        } catch (exception){

            for (let i=lastPosition; i >= 0 ; i--) {
                let result = this.transaction.blockchain.accountantTree.updateAccount(this.addresses[i].unencodedAddress, this.addresses[i].amount.multipliedBy(multiplicationFactor).negated(), this.transaction.from.currencyTokenId);

                if (result === null) throw {message: "error Updating Account", address: this.addresses[i]};
            }

        }

    }

}

export default MiniBlockchainTransactionTo