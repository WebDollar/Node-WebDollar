import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
import BufferExtended from 'common/utils/BufferExtended';
const EventEmitter = require('events');
import consts from 'consts/const_global'

class InterfaceBlockchainTransactionsEvents{

    constructor(blockchain){

        this.blockchain = blockchain;
        this.emitter = new EventEmitter();

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

        let result = {};

        for (let i=indexStart; i<indexEnd; i++){

            let block = this.blockchain.blocks[i];

            block.data.transactions.transactions.forEach((transaction)=>{

                if (this._searchAddressInTransaction(unencodedAddress, transaction)){

                    let txId = transaction.txId.toString("hex");
                    result[txId] = transaction.toJSON();
                    result[txId].confirmed = true;

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

                    if (this._searchAddressInTransaction(unencodedAddress, transaction)) {

                        let txId = transaction.txId.toString("hex");
                        result[txId.toString("hex")] = transaction.toJSON();
                        result[txId.toString("hex")].confirmed = false;
                    }

                }
            } catch (exception){
            }

        });


        return result;

    }

    subscribeTransactionsChanges(addressWIF, callback){

        if (addressWIF === '' || addressWIF === undefined || addressWIF === null || addressWIF==='') return {result: false, message: "address is invalid"};

        if (!Buffer.isBuffer(addressWIF) && typeof addressWIF === "string")
            addressWIF = BufferExtended.fromBase(addressWIF);

        let address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(addressWIF);

        if (address === null) return {result:false, message: "invalid address"};

        console.log("subscribeTransactionsChanges",BufferExtended.toBase(addressWIF) );

        let subscription = this.emitter.on("transactions/changes/"+BufferExtended.toBase(address), callback);

        return {
            result: true,
            subscription: subscription,
            transactions: this.listTransactions(addressWIF),
        }

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


    _checkTransactionIsSubscribed(address){

        let name;

        if (Buffer.isBuffer(address))
            name = "transactions/changes/"+BufferExtended.toBase(address);
        else
            name = address;

        //not working
        //TODO .eventNames() is not working
        let list = this.emitter._events;

        for (let key in list)
            if (key === name)
                return true;

        return false;
    }

}

export default InterfaceBlockchainTransactionsEvents