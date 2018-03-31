import BufferExtended from "common/utils/BufferExtended"
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";

class MiniBlockchainBalances{

    constructor(blockchain){

        this._blockchain = blockchain;

    }

    listBalances(address){

        if (address === '' || address === undefined || address === null)
            return null;

        try{

            return this._blockchain.accountantTree.listBalances(address);

        } catch (exception){
            return null;
        }

    }

    subscribeBalancesChanges(addressWIF, callback){

        if (addressWIF === '' || addressWIF === undefined || addressWIF === null || addressWIF==='') return {result: false, message: "address is invalid"};

        if (!Buffer.isBuffer(addressWIF) && typeof addressWIF === "string")
            addressWIF = BufferExtended.fromBase(addressWIF);

        let address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(addressWIF);

        if (address === null) return {result:false, message: "invalid address"};

        console.log("subscribeBalanceChanges",BufferExtended.toBase(addressWIF) );

        let subscription = this._blockchain.accountantTree.emitter.on("balances/changes/"+BufferExtended.toBase(address),callback);

        return {
            result: true,
            subscription: subscription,
            balances: this.listBalances(addressWIF),
        }
    }

    unsusbribeBalancesChanges(subscription){

        if (subscription === undefined || subscription === null) return false;

        if (typeof subscription === 'function')
            subscription();

        return true;
    }

}

export default MiniBlockchainBalances;