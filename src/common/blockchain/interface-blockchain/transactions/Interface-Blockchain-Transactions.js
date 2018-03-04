import consts from 'consts/const_global'
import InterfaceTransactionsPendingQueue from './pending/Interface-Transactions-Pending-Queue'
import InterfaceTransactionsUniqueness from './uniqueness/Interface-Transactions-Uniqueness'
import InterfaceTransaction from "./transaction/Interface-Blockchain-Transaction"
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'

class InterfaceBlockchainTransactions {

    constructor(){

        let db = new InterfaceSatoshminDB(consts.DATABASE_NAMES.TRANSACTIONS_DATABASE);

        this.pendingQueue = new InterfaceTransactionsPendingQueue(db);

        //this.uniqueness = new InterfaceTransactionsUniqueness(db);

    }

    createTransaction(address, to){

        let transaction = new InterfaceTransaction(address, to, undefined, undefined, undefined);

    }

}

export default InterfaceBlockchainTransactions;