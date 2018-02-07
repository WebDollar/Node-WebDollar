const colors = require('colors/safe');
const BigNumber = require('bignumber.js');
import InterfaceMerkleRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import MiniBlockchainAccountantTreeNode from './Mini-Blockchain-Accountant-Tree-Node'
import InterfaceMerkleTree from "common/trees/merkle-tree/Interface-Merkle-Tree";

import BufferExtended from "common/utils/BufferExtended"
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'

const EventEmitter = require('events');

class MiniBlockchainAccountantTree extends InterfaceMerkleRadixTree{

    constructor (db){

        super(db);

        this.autoMerklify = true;

        this.emitter = new EventEmitter();
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
            tokenId = Buffer.from([1]);
            tokenId[0] = 1;
        }

        address = InterfaceBlockchainAddressHelper.validateAddressChecksum(address);
        if (address === null) throw "sorry but your address is invalid";

        let node = this.search(address).node;

        // in case it doesn't exist, let's create it
        if ( node === undefined || node === null){
            node = this.add(address, {balances: [] });
        }

        if (!node.isLeaf()) throw "couldn't delete because input is not a leaf node";


        let resultUpdate = node.updateBalanceToken(value, tokenId);

        //WEBD
        if (tokenId.length === 1 && tokenId[0]===1){
            this.root.total = this.root.total.plus( value )
            this.emitter.emit("accountant-tree/root/total",this.root.total.toString());
        }

        //optimization, but it doesn't work in browser
        //if (this.checkBalanceSubscribed("balances/changes/"+BufferExtended.toBase(address))){

        let addressWIF = BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(address));
        this.emitter.emit("balances/changes/"+BufferExtended.toBase(address), { address: addressWIF, balances: (resultUpdate !== null ? node.getBalances() : null) } );

        if (resultUpdate === null) {
            this.delete(address)
            return null;
        }

        this._changedNode( node );

        return resultUpdate;
    }

    /**
     *
     * @param input must be Base or Base String
     * @returns {*}
     */
    listBalances(address){

        address = InterfaceBlockchainAddressHelper.validateAddressChecksum(address);
        if (address === null) throw "sorry but your address is invalid";

        let node = this.search(address).node;

        if (!node.isLeaf()) throw "couldn't delete because input is not a leaf node";

        return node.getBalances();

    }



    _changedNode(node){

        // recalculate the balances

        InterfaceMerkleTree.prototype._changedNode.call(this, node); //computing hash
    }

    validateTree(node, callback){

        // if (!InterfaceAccountantRadixTree.prototype.validateTree.call(this, node, callback)) //verifying hash and propagating it
        //     return false;

        if (!InterfaceMerkleTree.prototype.validateTree.call(this, node)) //computing hash
            return false;

        return true;
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
    _computeHash(node) {
        return InterfaceMerkleTree.prototype._computeHash.call(this, node);
    }

    _refreshHash(node, forced){
        return InterfaceMerkleTree.prototype._refreshHash.call(this, node,forced);
    }

    _getValueToHash(node){

        return node.serializeNode(false);
    }

    checkBalanceSubscribed(name){

        //not working
        let list = this.emitter.eventNames();

        for (let i=0; i<list.length; i++)
            if (list[i] === name) return true;

        return false;
    }

    serializeMiniAccountant(){
        return this.serializeTree();
    }

    deserializeMiniAccountant(buffer,offset){
        return this.deserializeTree(buffer,offset);
    }

    async saveMiniAccountant(includeHashes, name, serialization){
        return await this.saveTree(name||"accountantTree", includeHashes, serialization);
    }

    async loadMiniAccountant(buffer, offset, includeHashes, name){

        try {

            let result = await this.loadTree(name||"accountantTree", buffer, offset, includeHashes);

            //console.log("this.root", this.root);

            return result !== false;

        } catch (exception){
            console.log( colors.red("loadMiniAccountant error"), exception )
            return false;
        }

    }

    calculateNodeCoins(tokenId , node){

        if (tokenId === undefined  || tokenId === '' || tokenId === null) {
            tokenId = Buffer.from([1]);
            tokenId[0] = 1;
        }

        if (node === undefined) node = this.root;

        let sum = new BigNumber(0).plus( node.getBalance(tokenId)  );

        for (let i=0; i<node.edges.length; i++)
            if (node.edges[i].targetNode !== undefined && node.edges[i].targetNode !== null)
                sum = sum.plus( this.calculateNodeCoins( tokenId, node.edges[i].targetNode ) );

        return sum;

    }

}

export default MiniBlockchainAccountantTree