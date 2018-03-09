import NodePropagationProtocol from 'common/sockets/protocol/node-propagation-protocol'

class InterfaceTransactionsPendingQueue {

    constructor(db){

        this.list = [];

        this.db = db;
    }

    includePendingTransaction (transaction, exceptSockets){

        if (this.findTransaction(transaction) === -1){
            return false;
        }

        this.list.push(transaction);
        transaction.propagateTransaction(exceptSockets);

        return true;

    }

    findTransaction(transaction){

        for (let i = 0; i < this.list.length; i++)
            if (this.list[i] === transaction)
                return i;

        return -1;

    }

    removePendingTransaction (transaction){

        let index = this.findTransaction(transaction);

        if (index === -1)
            return true;

        this.list.splice(index, 1);

    }

    propagateTransaction(transaction, exceptSocket){
        NodePropagationProtocol.propagateNewPendingTransaction(transaction, exceptSocket)
    }


}

export default InterfaceTransactionsPendingQueue