class TransactionsListForPropagation{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.blockHash = new Buffer(0);
        this.existingList = {};
        this.list = [];

    }

    /**
     * TODO: Remove this class in order to avoid looping in this.list and repleace instead with this.listA TransactionPendingQueue
     */
    refreshTransactionsForPropagationList(){

        if ( this.blockchain.blocks.length > 0 && ( !Buffer.isBuffer(this.blockHash) || !this.blockHash.equals( this.blockchain.blocks.last.hash ) )){

            let transactions = {};
            let transactionsArray = [];

            for (let i=0; i< this.blockchain.transactions.pendingQueue.listArray.length; i++) {

                if (! this.blockchain.transactions.pendingQueue.listArray[i].isTransactionOK(true,true,{},true) ) continue;

                let tx = this.blockchain.transactions.pendingQueue.listArray[i];

                transactions[tx.txId.toString('hex')] = {exist: true};
                transactions.push(tx);
            }

            this.blockHash = this.blockchain.blocks.last.hash;
            this.existingList = transactions;
            this.list = transactionsArray;

        }

    }

    addTransactionForPropagationList(transaction, avoidValidation = false){

        if (!avoidValidation && !transaction.isTransactionOK(true,true,{},true)) return;

        if( this.existingList[transaction.txId.toString('hex')] === undefined ){

            this.existingList[transaction.txId.toString('hex')] = {exist: true};
            this.list.push(transaction);

        }

    }

}

export default TransactionsListForPropagation