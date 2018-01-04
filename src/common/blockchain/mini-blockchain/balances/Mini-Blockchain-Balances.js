import BufferExtended from "common/utils/BufferExtended"

class MiniBlockchainBalances{

    constructor(blockchain){

        this._blockchain = blockchain;

    }

    checkBalance(address){

        if (address === '' || address === undefined || address === null) return null;

        try{

            return this._blockchain.accountantTree.listBalances(address);

        } catch (exception){
            return null;
        }

    }

    subscribeBalanceChanges(address, callback){

        if (address === '' || address === undefined || address === null) return null;

        if (!Buffer.isBuffer(address))
            address = BufferExtended.fromBase(address);

        let subscription = this._blockchain.accountantTree.emitter.on("balances/changed"+address.toString(),callback);

        return {
            subscription: subscription,
            balance: this.checkBalance(address),
        }
    }

    unsusbribeBalanceChanges(subscription){

        this._blockchain.accountantTree.emitter.off(subscription);

    }

}

export default MiniBlockchainBalances;