import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'

import InterfaceMerkleRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import MiniBlockchainAccountantTreeNode from './Mini-Blockchain-Accountant-Tree-Node'

import BufferExtended from "common/utils/BufferExtended"
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import consts from 'consts/const_global'

import MiniBlockchainAccountantTreeEvents from "./Mini-Blockchain-Accountant-Tree-Events"
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";
import Blockchain from "main-blockchain/Blockchain";

class MiniBlockchainAccountantTree extends MiniBlockchainAccountantTreeEvents {

    createRoot() {

        this.root = new MiniBlockchainAccountantTreeNode(null, null, [], null);
        this.root.autoMerklify = true;
        this.root.deleteEmptyAddresses = false;
        this.root.root = this.root;

    }

    /**
     *
     * @param input must be Base or Base String
     * @param value
     * @param tokenId
     * @returns {*}
     */
    updateAccount(address, value, tokenId, revertActions, showUpdate = true) {

        if (tokenId === undefined || tokenId === '' || tokenId === null) {
            tokenId = new Buffer(consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.LENGTH);
            tokenId[0] = consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.VALUE;
        }

        address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);
        if ( !address )
            throw {message: "Your address is invalid", address: address};

        let node = this.search(address).node;

        // in case it doesn't exist, let's create it
        if ( !node ) node = this.add(address, {balances: []});

        //it is not a leaf, hardly to believe
        if (!node.isLeaf()) {
            this.delete(address);
            throw {message: "couldn't updateAccount because node is not leaf", address: address};
        }

        let resultUpdate = node.updateBalanceToken(value, tokenId);

        if (revertActions !== undefined) revertActions.push({
            name: "revert-updateAccount",
            address: address,
            value: value,
            tokenId: tokenId,
            showUpdate: showUpdate,
        });

        if (tokenId.length === consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.LENGTH && tokenId[0] === consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.VALUE) {
            this.root.total += value;

            if (showUpdate)
                this.emitter.emit("accountant-tree/root/total", this.root.total.toString());
        }

        //WEBD
        if (showUpdate)
            //optimization, but it doesn't work in browser
            this.emitBalanceChangeEvent(address, ( resultUpdate ? node.getBalances.bind(node) : null), (resultUpdate ? node.nonce : null) );

        //purging empty addresses
        if (!node.hasBalances()) {

            if (this.root.deleteEmptyAddresses ||   //TODO Window Transactions for Purging
                this.getAccountNonce(address) === 0) {

                this.delete(address);
                return null;

            }
        }

        node._changedNode();

        return resultUpdate;
    }

    updateAccountNonce(address, nonceChange, revertActions, showUpdate) {

        address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);
        if ( !address ) throw {message: "Your address is invalid", address: address};

        let node = this.search(address).node;

        // in case it doesn't exist, let's create it
        if ( !node ) throw {message: "Address was not found", address: address};

        if (!node.isLeaf())
            throw {message: "couldn't updateAccountNonce because node is not leaf", address: address};

        node.nonce += nonceChange;

        if (revertActions !== undefined) revertActions.push({
            name: "revert-updateAccountNonce",
            address: address,
            nonceChange: nonceChange,
            showUpdate: showUpdate,
        });

        if (!Number.isInteger(node.nonce)) throw {message: "nonce is invalid", nonce: node.nonce};

        node.nonce = node.nonce % 0x10000;
        if (node.nonce < 0) node.nonce = node.nonce + 0x10000;

        //force to delete first time miner
        if (node.nonce === 0 && !node.hasBalances(address)) { //TODO Window Transactions for Purging
            this.delete(address);
            return null;
        }

        node._changedNode();

        return node.nonce;
    }

    /**
     *
     * @param input must be Base or Base String
     * @returns {*}
     */
    listBalances(address) {

        address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);
        if (!address)
            throw {message: "Your address is invalid", address: address};

        let node = this.search(address).node;

        if ( !node ) throw {message: "address not found", address: address};

        if (!node.isLeaf()) throw {message: "couldn't list because input is not a leaf node"};

        return node.getBalances();
    }

    /**
     *
     * @param input must be Base or Base String
     * @returns {*}
     */
    getBalance(address, tokenId) {

        address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);

        if ( !address ) throw {message: "Your address is invalid", address: address};

        let node = this.search(address).node;

        if ( !node ) return null; //throw {message: "address not found", address: address, tokenId: tokenId };

        if (!node.isLeaf())
            return null; //throw {message: "couldn't get the value because input is not a leaf node", address: address, tokenId: tokenId };

        return node.getBalance(tokenId);
    }

    getAccountNonce(address) {

        address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);
        if (address === null) throw {message: "getAccountNonce - Your address is invalid", address: address};

        let node = this.search(address).node;

        if ( !node )
            return null; //throw {message: "getAccounantNonce address not found", address: address, tokenId: tokenId };

        return node.nonce;
    }


    /*
        inherited
    */


    serializeMiniAccountant(includeHashes = true, sleepNodes) {
        return this._serializeTree(includeHashes, sleepNodes);
    }


    deserializeMiniAccountant(buffer, offset, includeHashes = true) {
        return this._deserializeTree(buffer, offset, includeHashes);
    }

    async saveMiniAccountant(includeHashes, name, serialization, timeout) {
        return await this.saveTree(name || "accountantTree", includeHashes, serialization, timeout);
    }

    async loadMiniAccountant(buffer, offset, includeHashes, name = "accountantTree", showUpdate = true) {

        try {

            let result = await this.loadTree(name, buffer, offset, includeHashes);

            if (showUpdate)
                this.emitBalancesChanges();

            return result !== false;

        } catch (exception) {
            console.error("loadMiniAccountant error", exception)
            return false;
        }

    }

    calculateNodeCoins(tokenId, node) {

        if (!tokenId ) {
            tokenId = new Buffer(consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.LENGTH);
            tokenId[0] = consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.VALUE;
        }

        if (!node ) node = this.root;

        if (node === this.root && !Blockchain.blockchain.agent.consensus){
            return BlockchainMiningReward.getSumReward(Blockchain.blockchain.blocks.length-1);
        }

        let sum = node.getBalance(tokenId);

        for (let i = 0; i < node.edges.length; i++)
            if (node.edges[i].targetNode )
                sum += this.calculateNodeCoins(tokenId, node.edges[i].targetNode);

        return sum;

    }

    printAccountantTree() {

        let list = this.getAccountantTreeList();

        let obj = {};
        for (let i=0; i<list.length; i++) {

            console.info( i, list[i].address, list[i].balance / WebDollarCoins.WEBD );

            obj[list[i].address] = list[i].balance / WebDollarCoins.WEBD;
        }

        console.log(JSON.stringify(obj));

        return list;

    }

    getAccountantTreeList(){

        let list = [];
        list = this.root.getAccountantTreeList(list, false, true, 2000);

        return list;

    }

}

export default MiniBlockchainAccountantTree