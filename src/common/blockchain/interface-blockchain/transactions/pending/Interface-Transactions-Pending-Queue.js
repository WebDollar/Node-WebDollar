import NodePropagationProtocol from 'common/sockets/protocol/node-propagation-protocol'
import consts from 'consts/const_global'

class InterfaceTransactionsPendingQueue {

    constructor(blockchain, db){

        this.blockchain = blockchain;
        this.list = [];

        this.db = db;


        setInterval( ()=>{
            this._removeOldTransactions();
        }, 10000);

    }

    includePendingTransaction (transaction, exceptSockets){

        if (this.findPendingTransaction(transaction) === -1){
            return false;
        }

        this.list.push(transaction);
        transaction.propagateTransaction(exceptSockets);


        this._removeOldTransactions();

        return true;

    }

    findPendingTransaction(transaction){

        for (let i = 0; i < this.list.length; i++)
            if (this.list[i] === transaction)
                return i;

        return -1;
    }

    removePendingTransaction (transaction){

        let index = this.findPendingTransaction(transaction);

        if (index === -1)
            return true;

        this.list.splice(index, 1);
    }

    _removeOldTransactions (){
        for (let i=this.list.length; i >= 0; i--)
            //TimeLock to old
            if (this.list[i].timeLock !== 0 && this.list[i].timeLock < this.blockchain.blocks.length-1 - consts.MEM_POOL.TIME_LOCK.TRANSACTIONS_MAX_LIFE_TIME_IN_POOL_AFTER_EXPIRATION ){

                this.list.splice(i,1);

            }
    }

    propagateTransaction(transaction, exceptSocket){
        NodePropagationProtocol.propagateNewPendingTransaction(transaction, exceptSocket)
    }


}

export default InterfaceTransactionsPendingQueue