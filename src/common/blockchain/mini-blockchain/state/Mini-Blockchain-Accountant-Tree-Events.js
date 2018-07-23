import BufferExtended from "common/utils/BufferExtended"
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import InterfaceMerkleRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import AdvancedEmitter from "common/utils/Advanced-Emitter";

class MiniBlockchainAccountantTreeEvents extends InterfaceMerkleRadixTree {

    constructor(db){

        super(db);

        this.emitter = new AdvancedEmitter(1000);

    }


    _checkBalanceIsSubscribed(address){

        let name;

        if (Buffer.isBuffer(address))
            name = "balances/changes/"+BufferExtended.toBase(address);
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

    emitBalancesChanges(){

        //TODO .eventNames() is not working
        let list = this.emitter._events;

        for (let key in list)
            if (key.indexOf("balances/changes/") === 0) {

                let address = BufferExtended.fromBase(key.replace("balances/changes/", ""));

                let node = null;
                let balances = null;
                let nonce = null;

                try {

                    node = this.search(address).node;

                    // in case it doesn't exist, let's create it
                    if (node !== undefined && node !== null && node.isLeaf()) {
                        balances = node.getBalances();
                        nonce = node.nonce;
                    }

                } catch (exception) {

                }

                this.emitBalanceChangeEvent(address, ()=>{ return balances }, nonce  );
            }
    }

    emitBalanceChangeEvent(address, getBalanceCallback, nonce){

        if (this._checkBalanceIsSubscribed(address)) {
            let addressWIF = BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(address));
            this.emitter.emit("balances/changes/" + BufferExtended.toBase(address), {address: addressWIF, balances: getBalanceCallback === null ? getBalanceCallback : getBalanceCallback(), nonce: nonce });
        }

    }


}

export default MiniBlockchainAccountantTreeEvents;