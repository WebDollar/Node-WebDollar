class PendingTransactionsList{

    constructor(){

        this.list = []

    }

    includePendingTransaction(transaction){

        if (this.findTransaction(transaction) === null){
            return false;
        }

        this.list.push(transaction);
        transaction._propagateTransaction();

        return true;

    }

    findTransaction(transaction){

        for (let i=0; i<this.list.length; i++)
            if (this.list[i] === transaction)
                return i;

        return null;

    }

    removePendingTransaction (transaction){

        let index = this.findTransaction(transaction);

        if (index === null) return true;

        this.list.splice(index, 1);

    }



}

export default new PendingTransactionsList()