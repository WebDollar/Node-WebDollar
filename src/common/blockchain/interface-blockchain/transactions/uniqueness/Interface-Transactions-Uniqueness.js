import InterfaceRadixTree from 'common/trees/radix-tree/Interface-Radix-Tree'
import InterfaceBlockchainTransaction from 'common/blockchain/interface-blockchain/transactions/Interface-Blockchain-Transaction'

class InterfaceTransactionsUniqueness extends InterfaceRadixTree {

    addTransactionUniqueness(txId){

        if (txId instanceof InterfaceBlockchainTransaction)
            txId = txId.txId;

        return this.add(txId, true);
    }

    checkTransactionsUniqueness(txIds){
        if (Array.isArray(txIds))
            txIds = [txIds];


        for (let i=0; i<txIds.length; i++){
            if (this.checkTransactionUniqueness(txIds[i]))
                return true;
        }

        return false;

    }

    checkTransactionUniqueness(txId){

        if (txId instanceof InterfaceBlockchainTransaction)
            txId = txId.txId;

        return this.search(txId).result;

    }

    deleteTransactionUniqueness(txId){

        if (txId instanceof InterfaceBlockchainTransaction)
            txId = txId.txId;

        return this.delete(txId);

    }

    save(){

    }

    load(){

    }

}

export default InterfaceTransactionsUniqueness;