import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
import BufferExtended from 'common/utils/BufferExtended';
import AdvancedEmitter from "common/utils/Advanced-Emitter";
import consts from 'consts/const_global'

class InterfaceBlockchainTransactionsEvents{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.emitter = new AdvancedEmitter(1000);

    }

    async findTransaction(txId){

        if (typeof txId === "string")
            txId = new Buffer(txId, "hex");
        if (!Buffer.isBuffer(txId)) return null;

        for (let i=this.blockchain.blocks.blocksStartingPoint; i<this.blockchain.blocks.endingPosition; i++) {

            let block = await this.blockchain.getBlock(i);
            if (block === undefined) continue;

            for (let i=0; i<block.data.transactions.transactions.length; i++){
                if ( block.data.transactions.transactions[i].txId.equals(txId))
                    return block.data.transactions.transactions[i];
            }

        }

        return null;
    }

    async listTransactions(addressWIF, maxBlockCount = 50){

        if (addressWIF === '' || addressWIF === undefined || addressWIF === null || addressWIF==='')
            return [];

        if (!Buffer.isBuffer(addressWIF))
            addressWIF = BufferExtended.fromBase(addressWIF);

        let unencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(addressWIF);

        let result = {};

        let startingPoint = this.blockchain.blocks.blocksStartingPoint;

        for (let i=Math.max(startingPoint, this.blockchain.blocks.endingPosition-1-maxBlockCount); i<this.blockchain.blocks.endingPosition; i++){

            let block = await this.blockchain.getBlock(i);
            if (block === undefined) continue;

            block.data.transactions.transactions.forEach((transaction)=>{

                if (this._searchAddressInTransaction(unencodedAddress, transaction)){

                    let txId = transaction.txId.toString("hex");
                    result[txId] = transaction.toJSON();

                }
            });
        }


        let blockValidationType= {
            "take-transactions-list-in-consideration": {
                validation: true
            }
        };

        //adding the valid Pending Transactions
        this.blockchain.transactions.pendingQueue.listArray.forEach((transaction)=>{

            try {


                    if (this._searchAddressInTransaction(unencodedAddress, transaction)) {

                        let txId = transaction.txId.toString("hex");
                        result[txId.toString("hex")] = transaction.toJSON();
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

        let unsubcribe = this.emitter.on("transactions/changes/"+BufferExtended.toBase(address), callback);

        return {
            result: true,
            subscription: unsubcribe,
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

        for (let i=0; i<transaction.from.addresses.length; i++)
            if (BufferExtended.safeCompare(transaction.from.addresses[i].unencodedAddress, unencodedAddress))
                return true;

        for (let i=0; i<transaction.to.addresses.length; i++)
            if (BufferExtended.safeCompare(transaction.to.addresses[i].unencodedAddress, unencodedAddress))
                return true;

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

    emitTransactionChangeEvent(transaction, deleted=false){

        if (deleted){
            if (this.findTransaction(transaction.txId) !== null) //I found a transaction already in Blockchain
                return false;
        }

        transaction.from.addresses.forEach((address)=>{
            if (this._checkTransactionIsSubscribed(address.unencodedAddress)) {

                let addressWIF = BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(address.unencodedAddress));

                try{
                    this.emitter.emit("transactions/changes/" + BufferExtended.toBase(address.unencodedAddress), { txId: transaction.txId.toString("hex"), address: addressWIF, transaction: deleted ? undefined : transaction.toJSON()});
                }catch (ex){
                    console.error("Transaction From/Changes raised an error", ex, transaction.toJSON()) ;
                }
            }
        });

        transaction.to.addresses.forEach((address)=>{
            if (this._checkTransactionIsSubscribed(address.unencodedAddress)) {

                let addressWIF = BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(address.unencodedAddress));

                try{
                    this.emitter.emit("transactions/changes/" + BufferExtended.toBase(address.unencodedAddress), { txId: transaction.txId.toString("hex"), address: addressWIF, transaction: deleted ? undefined : transaction.toJSON()});
                }catch (ex){
                    console.error("Transaction To/Changes raised an error", ex, transaction.toJSON()) ;
                }
            }
        });

    }

}

export default InterfaceBlockchainTransactionsEvents