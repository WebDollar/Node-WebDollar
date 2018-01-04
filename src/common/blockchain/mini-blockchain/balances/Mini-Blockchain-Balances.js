import BufferExtended from "common/utils/BufferExtended"

class MiniBlockchainBalances{

    constructor(blockchain){

        this._blockchain = blockchain;

    }

    checkBalance(address){

        try{

            return this._blockchain.accountantTree.listBalances(address);

        } catch (exception){
            return null;
        }

    }

    registerBalanceChanges(address, callback){

        if (!Buffer.isBuffer(address))
            address = BufferExtended.fromBase(address);

        return this._blockchain.accountantTree.emitter.on("balances/changed"+address.toString(),callback);
    }

}

export default MiniBlockchainBalances;