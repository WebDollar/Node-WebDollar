import InterfaceMerkleRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import MiniBlockchainAccountantTreeNode from './Mini-Blockchain-Accountant-Tree-Node'

import BufferExtended from "common/utils/BufferExtended"
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import consts from 'consts/const_global'

import MiniBlockchainAccountantTreeEvents from "./Mini-Blockchain-Accountant-Tree-Events"

class MiniBlockchainAccountantTree extends MiniBlockchainAccountantTreeEvents {

    createRoot(){
        this.root = new MiniBlockchainAccountantTreeNode(null, null,  [], null);
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
    updateAccount(address, value, tokenId, revertActions){

        if (tokenId === undefined  || tokenId === '' || tokenId === null) {
            tokenId = new Buffer(consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.LENGTH);
            tokenId[0] = consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.VALUE;
        }

        address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);
        if (address === null)
            throw {message: "Your address is invalid", address: address };

        let node = this.search(address).node;

        // in case it doesn't exist, let's create it
        if ( node === undefined || node === null)
            node = this.add(address, {balances: []});

        //it is not a leaf, hardly to believe
        if (!node.isLeaf()) {
            this.delete(address);
            throw {message: "couldn't updateAccount because node is not leaf", address: address};
        }

        let resultUpdate = node.updateBalanceToken(value, tokenId);

        if (revertActions !== undefined) revertActions.push ( { name: "revert-updateAccount", address: address, value:value, tokenId : tokenId } );

        //WEBD
        if (tokenId.length === consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.LENGTH && tokenId[0] === consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.VALUE ){
            this.root.total += value;
            this.emitter.emit("accountant-tree/root/total", this.root.total.toString());
        }

        //optimization, but it doesn't work in browser
        this.emitBalanceChangeEvent(address, ()=>{
            return (resultUpdate !== null ? node.getBalances() : null);
        });

        //purging empty addresses
        if ( !node.hasBalances() ) {

            if (this.root.deleteEmptyAddresses ||   //TODO Window Transactions for Purging
                this.getAccountNonce(address) === 0 ) {

                this.delete(address);
                return null;

            }
        }

        node._changedNode();

        return resultUpdate;
    }

    updateAccountNonce(address, nonceChange, revertActions){

        address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);
        if (address === null)
            throw {message: "Your address is invalid", address: address };

        let node = this.search(address).node;

        // in case it doesn't exist, let's create it
        if ( node === undefined || node === null)
            throw {message: "Address was not found", address: address};

        if (!node.isLeaf())
            throw {message: "couldn't updateAccountNonce because node is not leaf", address: address};

        node.nonce += nonceChange;

        if (revertActions !== undefined) revertActions.push ( { name: "revert-updateAccountNonce", address: address, nonceChange: nonceChange } );

        if (!Number.isInteger(node.nonce)) throw {message: "nonce is invalid", nonce: node.nonce};

        node.nonce = node.nonce % 0xFFFF;
        if (node.nonce < 0) node.nonce = node.nonce + 0xFFFF;

        //force to delete first time miner
        if (node.nonce === 0 && !node.hasBalances(address) ) { //TODO Window Transactions for Purging
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
    listBalances(address){

        address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);
        if (address === null)
            throw {message: "Your address is invalid", address: address };

        let node = this.search(address).node;

        if (node === undefined || node === null)
            throw {message: "address not found", address: address};

        if (!node.isLeaf())
            throw {message: "couldn't list because input is not a leaf node"};

        return node.getBalances();
    }

    /**
     *
     * @param input must be Base or Base String
     * @returns {*}
     */
    getBalance(address, tokenId){

        address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);
        if (address === null)
            throw {message: "Your address is invalid", address: address };

        let node = this.search(address).node;

        if (node === undefined || node === null)
            return null; //throw {message: "address not found", address: address, tokenId: tokenId };

        if (!node.isLeaf())
            return null; //throw {message: "couldn't get the value because input is not a leaf node", address: address, tokenId: tokenId };

        return node.getBalance(tokenId);
    }

    getAccountNonce(address){

        address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);
        if (address === null) throw {message: "getAccountNonce - Your address is invalid", address: address };

        let node = this.search(address).node;

        if (node === undefined || node === null)
            return null; //throw {message: "getAccounantNonce address not found", address: address, tokenId: tokenId };

        return node.nonce;
    }


    /*
        inherited
    */



    serializeMiniAccountant(includeHashes=true){
        return this._serializeTree(includeHashes);
    }

    _deserializeTree(buffer, offset, includeHashes){
        let answer = InterfaceMerkleRadixTree.prototype._deserializeTree.call(this, buffer, offset, includeHashes);
        this.emitBalancesChanges();
        return answer;
    }

    deserializeMiniAccountant(buffer,offset, includeHashes = true){
        return this._deserializeTree(buffer,offset, includeHashes);
    }

    async saveMiniAccountant(includeHashes, name, serialization){
        return await this.saveTree(name||"accountantTree", includeHashes, serialization);
    }

    async loadMiniAccountant(buffer, offset, includeHashes, name = "accountantTree"){

        try {

            let result = await this.loadTree(name, buffer, offset, includeHashes);

            //console.log("this.root", this.root);
            this.emitBalancesChanges();

            return result !== false;

        } catch (exception){
            console.error( "loadMiniAccountant error", exception )
            return false;
        }

    }

    calculateNodeCoins(tokenId , node){

        if (tokenId === undefined  || tokenId === '' || tokenId === null) {
            tokenId = new Buffer(consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.LENGTH);
            tokenId[0] = consts.MINI_BLOCKCHAIN.TOKENS.WEBD_TOKEN.VALUE;
        }

        if (node === undefined) node = this.root;

        let sum = node.getBalance(tokenId);

        for (let i = 0; i < node.edges.length; i++)
            if (node.edges[i].targetNode !== undefined && node.edges[i].targetNode !== null)
                sum += this.calculateNodeCoins( tokenId, node.edges[i].targetNode );

        return sum;

    }


}

export default MiniBlockchainAccountantTree