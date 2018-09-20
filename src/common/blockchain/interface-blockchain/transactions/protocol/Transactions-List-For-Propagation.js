class TransactionsListForPropagation{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.blockHash = new Buffer(0);
        this.list = [];

    }

    /**
     * TODO: this function should not be used everything, but rather anytime something was changed
     */
    refreshTransactionsForPropagationList(){

        if ( this.blockchain.blocks.length > 0 && ( !Buffer.isBuffer(this.blockHash) || !this.blockHash.equals( this.blockchain.blocks.last.hash ) )){

            let transactions = [];

            for (let i=0; i< this.blockchain.transactions.pendingQueue.list.length; i++) {

                if (! this.blockchain.transactions.pendingQueue.list[i].isTransactionOK(true)) continue;

                transactions.push( this.blockchain.transactions.pendingQueue.list[i] );
            }

            this.blockHash = this.blockchain.blocks.last.hash;
            this.list = transactions;

        }

    }

    addTransactionForPropagationList(transaction, avoidValidation = false){

        if (!avoidValidation && !transaction.isTransactionOK(true)) return;

        if (this.findTransactionForPropagationList(transaction) === -1)
            this.list.push(transaction);

    }

    findTransactionForPropagationList(transaction){

        if ( transaction === undefined || !Buffer.isBuffer(transaction.txId)) return -1;

        for (let i = 0; i < this.list.length; i++)
            if ( this.list[i].txId !== undefined && this.list[i].txId.equals( transaction.txId )) //it is not required to use BufferExtended.safeCompare
                return i;

        return -1;
    }

}

export default TransactionsListForPropagation