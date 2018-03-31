const EventEmitter = require('events');
import BufferExtended from "common/utils/BufferExtended"
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import InterfaceMerkleRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'

class MiniBlockchainAccountantTreeEvents extends InterfaceMerkleRadixTree {

    constructor(db){

        super(db);

        this.emitter = new EventEmitter()
    }


    checkBalanceIsSubscribed(address){

        let name;

        if (Buffer.isBuffer(address))
            name = "balances/changes/"+BufferExtended.toBase(name);
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

                try {

                    node = this.search(address).node;

                    // in case it doesn't exist, let's create it
                    if (node !== undefined && node !== null && node.isLeaf()) {
                        balances = node.getBalances();
                    }

                } catch (exception) {

                }

                let addressWIF = BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(address));
                this.emitter.emit("balances/changes/" + BufferExtended.toBase(address), {
                    address: addressWIF,
                    balances: balances
                });
            }
    }

    propagateBalanceChangeEvent(address, getBalanceCallback){

        if (this.checkBalanceIsSubscribed(address)) {
            let addressWIF = BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(address));
            this.emitter.emit("balances/changes/" + BufferExtended.toBase(address), {address: addressWIF, balances: getBalanceCallback() });
        }

    }

}

export default MiniBlockchainAccountantTreeEvents;