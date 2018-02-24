import consts from 'consts/const_global'
import InterfaceTransactionsPendingQueue from './pending/Interface-Transactions-Pending-Queue'
import InterfaceTransactionsUniqueness from './uniqueness/Interface-Transactions-Uniqueness'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'

class InterfaceBlockchainTransactions{

    constructor(){

        let db = InterfaceSatoshminDB(consts.DATABASE_NAMES.TRANSACTIONS_DATABASE);

        this.pendingQueue = new InterfaceTransactionsPendingQueue(db);
        this.uniqueness = new InterfaceTransactionsUniqueness(db);

    }

}

export default InterfaceBlockchainTransactions;