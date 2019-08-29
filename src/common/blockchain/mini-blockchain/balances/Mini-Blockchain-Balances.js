import BufferExtended from "common/utils/BufferExtended"
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";

class MiniBlockchainBalances{

    constructor(blockchain){

        this._blockchain = blockchain;

    }

    listBalances(address){

        if ( !address ) return null;

        try{

            return this._blockchain.accountantTree.listBalances(address);

        } catch (exception){
            return null;
        }

    }

    getNonce(address){


        if ( !address ) return null;

        try{

            return this._blockchain.accountantTree.getAccountNonce(address);

        } catch (exception){
            return null;
        }

    }

    subscribeBalancesChanges(addressWIF, callback){

        if ( !addressWIF ) return {result: false, message: "address is invalid"};

        if (!Buffer.isBuffer(addressWIF) && typeof addressWIF === "string")
            addressWIF = BufferExtended.fromBase(addressWIF);

        let address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(addressWIF);

        if ( !address ) return {result:false, message: "invalid address"};

        let unsubscribe = this._blockchain.accountantTree.emitter.on("balances/changes/"+BufferExtended.toBase(address),callback);

        return {
            result: true,
            subscription: unsubscribe,
            balances: this.listBalances(addressWIF),
            nonce: this.getNonce(addressWIF),
        }
    }


}

export default MiniBlockchainBalances;