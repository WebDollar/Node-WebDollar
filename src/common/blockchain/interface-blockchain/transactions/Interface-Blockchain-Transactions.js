import consts from 'consts/const_global'
import TransactionsPendingQueue from './pending/Transactions-Pending-Queue'
import InterfaceTransaction from "./transaction/Interface-Blockchain-Transaction"
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import InterfaceBlockchainTransactionsWizard from "./wizard/Interface-Blockchain-Transactions-Wizard";
import InterfaceBlockchainTransactionsEvents from "./Interface-Blockchain-Transactions-Events";

class InterfaceBlockchainTransactions extends InterfaceBlockchainTransactionsEvents {

    constructor( blockchain, wallet ){

        super(blockchain);

        this.wallet = wallet;

        let db = new InterfaceSatoshminDB(consts.DATABASE_NAMES.TRANSACTIONS_DATABASE);

        //the Queue is an inverted Queue, because elements are added at the end of the List (queue)
        this.pendingQueue = new TransactionsPendingQueue( this, blockchain, db );

        this.wizard = new InterfaceBlockchainTransactionsWizard(this, blockchain, wallet);
    }


    _createTransaction(from, to, nonce, timeLock, version, txId, validateFrom, validateTo, validateNonce, validateTimeLock, validateVersion, validateTxId ){
        return new InterfaceTransaction(this.blockchain, from, to, nonce, timeLock, txId, validateFrom, validateTo, validateNonce, validateTimeLock, validateVersion, validateTxId);
    }

    _createTransactionFromBuffer(buffer, offset = 0){

        let transaction = this._createTransaction ( undefined, undefined, 0, 0xFFFFFFFF, 0x00, new Buffer(32), false, false, false, false, false, false );
        offset = transaction.deserializeTransaction(buffer, offset);
        return {transaction: transaction, offset: offset};
    }

    setWallet(newWallet){
        this.wallet = newWallet;
        this.wizard.wallet = newWallet;
    }


}

export default InterfaceBlockchainTransactions;