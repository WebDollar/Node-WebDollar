import consts from 'consts/const_global'
import InterfaceTransactionsPendingQueue from './pending/Interface-Transactions-Pending-Queue'
import InterfaceTransaction from "./transaction/Interface-Blockchain-Transaction"
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
import InterfaceBlockchainTransactionsWizard from "./Interface-Blockchain-Transactions-Wizard";
import BufferExtended from 'common/utils/BufferExtended';

class InterfaceBlockchainTransactions {

    constructor( blockchain, wallet ){

        this.blockchain = blockchain;
        this.wallet = wallet;

        let db = new InterfaceSatoshminDB(consts.DATABASE_NAMES.TRANSACTIONS_DATABASE);

        //the Queue is an inverted Queue, because elements are added at the end of the List (queue)
        this.pendingQueue = new InterfaceTransactionsPendingQueue(blockchain, db);

        this.wizard = new InterfaceBlockchainTransactionsWizard(this, blockchain, wallet);

    }

    _createTransaction(from, to, nonce, timeLock, version, txId, validateFrom, validateTo){
        return new InterfaceTransaction(this.blockchain, from, to, nonce, timeLock, txId, validateFrom, validateTo);
    }

    _createTransactionFromBuffer(buffer, offset = 0){

        let transaction = this._createTransaction ( undefined, undefined, 0, 0xFFFFFFFF, 0x00, new Buffer(32), false, false );
        offset = transaction.deserializeTransaction(buffer, offset);
        return {transaction: transaction, offset: offset};
    }


    listTransactions(addressWIF){

        if (addressWIF === '' || addressWIF === undefined || addressWIF === null || addressWIF==='')
            return [];

        if (!Buffer.isBuffer(addressWIF))
            addressWIF = BufferExtended.fromBase(addressWIF);

        let unencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(addressWIF);

        let indexStart, indexEnd;
        if (this.blockchain.agent.light){

            indexStart = this.blockchain.blocks.length-1  - consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS;
            indexEnd = this.blockchain.blocks.length;

        } else {

            //full node
            indexStart = 0;
            indexEnd = this.blockchain.blocks.length;
        }

        let result = [];
        for (let i=indexStart; i<indexEnd; i++){

            let block = this.blockchain.blocks[i];

            block.data.transactions.transactions.forEach((transaction)=>{

                if (this._searchAddressInTransaction(unencodedAddress, transaction)){
                    result.push({
                        transaction:transaction,
                        confirmed: true,
                    });
                }
            });
        }


        let blockValidation = { blockValidationType: {
            "take-transactions-list-in-consideration": {
                validation: true
            }
        }};

        //adding the valid Pending Transactions
        this.blockchain.transactions.pendingQueue.list.forEach((transaction)=>{

            try {
                if (transaction.validateTransactionEveryTime(undefined, blockValidation)) {

                    if (this._searchAddressInTransaction(unencodedAddress, transaction))
                        result.push({
                            confirmed: false,
                            transaction: transaction,
                        });

                }
            } catch (exception){
            }

        });


        return result;

    }

    subscribeTransactionsChanges(address){

    }

    unsusbribeTransactionsChanges(subscription){

        if (subscription === undefined || subscription === null) return false;

        if (typeof subscription === 'function')
            subscription();

        return true;
    }


    _searchAddressInTransaction(unencodedAddress, transaction){

        for (let i=0; i<transaction.from.addresses.length; i++){
            if (transaction.from.addresses[i].unencodedAddress.equals(unencodedAddress))
                return true;
        }

        for (let i=0; i<transaction.to.addresses.length; i++){
            if (transaction.to.addresses[i].unencodedAddress.equals(unencodedAddress))
                return true;
        }

        return false;
    }

    setWallet(newWallet){
        this.wallet = newWallet;
        this.wizard.wallet = newWallet;
    }

}

export default InterfaceBlockchainTransactions;