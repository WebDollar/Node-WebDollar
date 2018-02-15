import InterfaceRadixTree from 'common/trees/radix-tree/Interface-Radix-Tree'
import InterfaceBlockchainTransaction from 'common/blockchain/interface-blockchain/transactions/transaction/Interface-Blockchain-Transaction'

class InterfaceTransactionsUniqueness extends InterfaceRadixTree {

    addTransactionUniqueness(txId){

        if (txId instanceof InterfaceBlockchainTransaction)
            txId = txId.txId;

        return this.add(txId, true);
    }

    searchTransactionsUniqueness(txIds){

        if (!Array.isArray(txIds))
            txIds = [txIds];


        for (let i=0; i<txIds.length; i++){
            if (this.searchTransactionUniqueness(txIds[i]))
                return true;
        }

        return false;

    }

    searchTransactionUniqueness(txId){

        if (txId instanceof InterfaceBlockchainTransaction)
            txId = txId.txId;

        return this.search(txId).result;

    }

    deleteTransactionUniqueness(txId){

        if (txId instanceof InterfaceBlockchainTransaction)
            txId = txId.txId;

        return this.delete(txId);

    }

    saveTransactionsUniqueness(){

    }

    loadTrasactionsUniqueness(){

    }

}

export default InterfaceTransactionsUniqueness;