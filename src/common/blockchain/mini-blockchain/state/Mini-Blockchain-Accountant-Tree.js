const BigNumber = require('bignumber.js');

import InterfaceMerkleRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import MiniBlockchainAccountantTreeNode from './Mini-Blockchain-Accountant-Tree-Node'
import InterfaceMerkleTree from "common/trees/merkle-tree/Interface-Merkle-Tree";

import BufferExtended from "common/utils/BufferExtended"
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import consts from 'consts/const_global'

const EventEmitter = require('events');

class MiniBlockchainAccountantTree extends InterfaceMerkleRadixTree{

    constructor (db){

        super(db);

        this.autoMerklify = true;

        this.emitter = new EventEmitter();
    }

    validateRoot(validateMerkleTree){

        if (!InterfaceMerkleRadixTree.prototype.validateRoot.apply(this, arguments)) return false;

        if (validateMerkleTree)
            this._validateHash(validateMerkleTree);

    }

    _createNode(parent, edges, value){
        return new MiniBlockchainAccountantTreeNode(parent, edges, value);
    }

    /**
     *
     * @param input must be Base or Base String
     * @param value
     * @param tokenId
     * @returns {*}
     */
    updateAccount(address, value, tokenId){

        if (tokenId === undefined  || tokenId === '' || tokenId === null) {
            tokenId = new Buffer(consts.MINI_BLOCKCHAIN.TOKEN_CURRENCY_ID_LENGTH);
            tokenId[0] = 0x01;
        }

        address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);
        if (address === null)
            throw {message: "Your address is invalid", address: address };

        let node = this.search(address).node;

        // in case it doesn't exist, let's create it
        if ( node === undefined || node === null)
            node = this.add(address, {balances: [] });

        if (!node.isLeaf())
            throw {message: "couldn't updateAccount because node is not leaf", address: address};

        let resultUpdate = node.updateBalanceToken(value, tokenId);

        //WEBD
        if (tokenId.length === 1 && tokenId[0] === 1){
            this.root.total = this.root.total.plus( value );
            this.emitter.emit("accountant-tree/root/total", this.root.total.toString());
        }

        //optimization, but it doesn't work in browser
        if (this.checkBalanceIsSubscribed(address)) {
            let addressWIF = BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(address));
            this.emitter.emit("balances/changes/" + BufferExtended.toBase(address), {address: addressWIF, balances: (resultUpdate !== null ? node.getBalances() : null)});
        }

        if (resultUpdate === null) {
            this.delete(address);
            return null;
        }

        this._changedNode( node );

        return resultUpdate;
    }

    updateAccountNonce(address, nonceChange){

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

        if (!Number.isNumber(node.nonce)) throw {message: "nonce is invalid"};

        node.nonce = node.nonce % 0xFFFF;
        if (node.nonce < 0) node.nonce = node.nonce + 0xFFFF;

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
        if (node === undefined || node === null) throw {message: "getAccountNonce - address not found", address: address };

        return node.nonce;
    }

    _changedNode(node){

        // recalculate the balances
        InterfaceMerkleTree.prototype._changedNode.call(this, node); //computing hash
    }

    _checkInvalidNode(node){

        //if (!InterfaceAccountantRadixTree.prototype._checkInvalidNode.call(this, node)) return false;
        return InterfaceMerkleTree.prototype._checkInvalidNode.call(this, node);
    }

    _validateHash(node){
        return InterfaceMerkleTree.prototype._validateHash.call(this, node);
    }

    /*
        inherited
    */


    _getValueToHash(node){
        return node.serializeNode(false, false);
    }

    checkBalanceIsSubscribed(name){

        if (Buffer.isBuffer(name))
            name = "balances/changes/"+BufferExtended.toBase(name);

        //not working
        //TODO .eventNames() is not working
        let list = this.emitter._events;

        for (let key in list)
            if (key === name)
                return true;

        return false;
    }

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
            tokenId = new Buffer(consts.MINI_BLOCKCHAIN.TOKEN_CURRENCY_ID_LENGTH);
            tokenId[0] = 0x01;
        }

        if (node === undefined) node = this.root;

        let sum = new BigNumber(0).plus( node.getBalance(tokenId)  );

        for (let i = 0; i < node.edges.length; i++)
            if (node.edges[i].targetNode !== undefined && node.edges[i].targetNode !== null)
                sum = sum.plus( this.calculateNodeCoins( tokenId, node.edges[i].targetNode ) );

        return sum;

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

}

export default MiniBlockchainAccountantTree