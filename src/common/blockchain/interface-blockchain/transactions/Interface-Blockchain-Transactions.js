import InterfaceTransactionsPendingQueue from './pending/Interface-Transactions-Pending-Queue'
import InterfaceTransactionsUniqueness from './uniqueness/Interface-Transactions-Uniqueness'

class InterfaceBlockchainTransactions{

    constructor(){

        this.pendingQueue = new InterfaceTransactionsPendingQueue();
        this.uniqueness = new InterfaceTransactionsUniqueness();

    }

}

export default InterfaceBlockchainTransactions;