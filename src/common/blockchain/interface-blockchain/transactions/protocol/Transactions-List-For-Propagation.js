class TransactionsListForPropagation{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.blockHash = new Buffer(0);
        this.list = [];

    }

    refreshTransactionsForPropagationList(){

        if ( this.blockchain.blocks.length > 0 && !this.blockHash.equals( this.blockchain.blocks.last.hash ) ){

            let transactions = [];

            for (let i=0; i< this.blockchain.transactions.pendingQueue.list.length; i++) {

                if (! this.blockchain.transactions.pendingQueue.list[i].isTransactionOK(true)) continue;

                transactions.push( this.blockchain.transactions.pendingQueue.list[i] );
            }

            this.blockHash = this.blockchain.blocks.last.hash;
            this.list = transactions;

        }

    }

    addTransactionForPropagationList(transaction){

        if (!transaction.isTransactionOK(true)) return;

        if (!this.findTransactionForPropagationList(transaction))
            this.list.transactions.push(transaction);

    }

    findTransactionForPropagationList(transaction){

        for (let i=0; i< this.list.length; i++)
            if (this.list[i].txId.equals( transaction.txId )){
                return i;
            }

        return -1;
    }

}

export default TransactionsListForPropagation