import InterfaceBlockchainTransactionFrom from 'common/blockchain/interface-blockchain/transactions/transaction/Interface-Blockchain-Transaction-From'

class MiniBlockchainTransactionFrom extends InterfaceBlockchainTransactionFrom{

    validateFrom(){

        let result = InterfaceBlockchainTransactionFrom.prototype.validateFrom.call(this);

        this.addresses.forEach ( (fromObject, index) =>{

            let value = this.transaction.blockchain.accountantTree.getBalance( fromObject.unencodedAddress, this.currencyTokenId );

            if (value.isLessThan(fromObject.amount))
                throw { message: "Value is Less than From.address.amount", address: fromObject, index: index };

        });

        return true;

    }


}

export default MiniBlockchainTransactionFrom