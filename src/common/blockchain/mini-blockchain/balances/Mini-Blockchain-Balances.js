import BufferExtended from "common/utils/BufferExtended"
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";

class MiniBlockchainBalances{

    constructor(blockchain){

        this._blockchain = blockchain;

    }

    checkBalances(address){

        if (address === '' || address === undefined || address === null)
            return null;

        try{

            return this._blockchain.accountantTree.listBalances(address);

        } catch (exception){
            return null;
        }

    }

    subscribeBalancesChanges(addressWIF, callback){

        if (addressWIF === '' || addressWIF === undefined || addressWIF === null || addressWIF==='')
            return null;

        if (!Buffer.isBuffer(addressWIF) && addressWIF !== '' && addressWIF !== undefined)
            addressWIF = BufferExtended.fromBase(addressWIF);

        let address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(addressWIF);

        console.log("subscribeBalanceChanges",BufferExtended.toBase(addressWIF) );

        let subscription = this._blockchain.accountantTree.emitter.on("balances/changes/"+BufferExtended.toBase(address),callback);

        return {
            subscription: subscription,
            balances: this.checkBalances(addressWIF),
        }
    }

    unsusbribeBalancesChanges(subscription){

        if (subscription === undefined || subscription === null)
            return false;

        if (typeof subscription === 'function')
            subscription();

        return true;

    }

}

export default MiniBlockchainBalances;