import Serialization from "common/utils/Serialization";

const SAVE_ONLY_MY_TRANSACTIONS = true;
import consts from "consts/const_global"
import Log from 'common/utils/logging/Log';
import MiniBlockchainTransaction from "../../../mini-blockchain/transactions/trasanction/Mini-Blockchain-Transaction";

class TransactionsPendingQueueSavingManager{

    constructor(blockchain, pendingQueue, db){

        this.blockchain = blockchain;
        this.pendinQueue = pendingQueue;

        this.db = db;

    }


    async savePendingTransactions(){

        if (process.env.BROWSER) return;

        let serialization = this._serializePendingTransactions();

        let answer = await this.db.save("pendingTransactions", serialization );

        if (!answer)
            Log.error("Saving Pending Transactions failed", Log.LOG_TYPE.BLOCKCHAIN);

    }

    async loadPendingTransactions(){

        if (process.env.BROWSER) return;

        let data = await this.db.get("pendingTransactions");

        if (data === null) return true; //nothing to process

        if (Buffer.isBuffer(data))
            this._deserializePendingTransactions(data);


        return true;

    }



    _serializePendingTransactions(){

        let data = [];
        for (let i=0; i<this.pendinQueue.list.length; i++){

            let transaction = this.pendinQueue.list[i];

            if (!SAVE_ONLY_MY_TRANSACTIONS || (SAVE_ONLY_MY_TRANSACTIONS && transaction.from.addresses[0].unencodedMinerAddress.equals(this.blockchain.mining.unencodedMinerAddress) )){

                let buffer = transaction.serializeTransaction();
                data.push(buffer);

            }

        }

        return Buffer.concat([

            Serialization.serializeNumber4Bytes(data.length),
            data,

        ]);


    }

    _deserializePendingTransactions(buffer, offset  = 0){

        try {

            let count = Serialization.deserializeNumber4Bytes(buffer, offset);
            for (let i = 0; i < count; i++) {


                let transaction = new MiniBlockchainTransaction(this.blockchain);
                offset = transaction.deserializeTransaction(buffer, offset);

                try {
                    this.pendinQueue.includePendingTransaction(transaction);
                } catch (exception){
                    Log.error("Error Including Pending Transaction", Log.LOG_TYPE.BLOCKCHAIN, error);
                }

            }

        } catch (exception){

            Log.error("Error Deserializing Pending Transaction", Log.LOG_TYPE.BLOCKCHAIN, error);

        }

    }

}

export default TransactionsPendingQueueSavingManager;