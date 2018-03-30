import InterfaceBlockchainTransactionFrom from 'common/blockchain/interface-blockchain/transactions/transaction/Interface-Blockchain-Transaction-From'

const BigNumber = require('bignumber.js');

class MiniBlockchainTransactionFrom extends InterfaceBlockchainTransactionFrom{


    validateFromEnoughMoney(blockValidation){

        this.addresses.forEach ( (fromObject, index) =>{

            let value = this.transaction.blockchain.accountantTree.getBalance( fromObject.unencodedAddress, this.currencyTokenId );

            if (value === null) throw {message: "Accountant Tree Input doesn't exist", unencodedAddress: fromObject.unencodedAddress}

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