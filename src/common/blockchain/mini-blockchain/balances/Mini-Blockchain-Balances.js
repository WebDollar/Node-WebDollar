import BufferExtended from "common/utils/BufferExtended"
import InterfaceBlockchainAddressHelper from "../../interface-blockchain/addresses/Interface-Blockchain-Address-Helper";

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

    subscribeBalanceChanges(addressWIF, callback){

        if (addressWIF === '' || addressWIF === undefined || addressWIF === null) return null;

        if (!Buffer.isBuffer(addressWIF))
            addressWIF = BufferExtended.fromBase(addressWIF);

        let address = InterfaceBlockchainAddressHelper.validateAddressChecksum(addressWIF);

        console.log("subscribeBalanceChanges",addressWIF );

        let subscription = this._blockchain.accountantTree.emitter.on("balances/changes/"+BufferExtended.toBase(address),callback);

        return {
            subscription: subscription,
            balance: this.checkBalance(addressWIF),
        }
    }

    unsusbribeBalanceChanges(subscription){

        if (subscription === undefined || subscription === null) return false;

        subscription();

    }

}

export default MiniBlockchainBalances;