import InterfaceMerkleAccountantRadixTree from 'common/trees/radix-tree/accountant-tree/merkle-tree/Interface-Merkle-Accountant-Radix-Tree'
import InterfaceMerkleRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import InterfaceRadixTree from 'common/trees/radix-tree/Interface-Radix-Tree'
import MiniBlockchainAccountantTreeNode from './Mini-Blockchain-Accountant-Tree-Node'
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'
import InterfaceMerkleTree from "common/trees/merkle-tree/Interface-Merkle-Tree";

import BufferExtended from "common/utils/BufferExtended"

const EventEmitter = require('events');

class MiniBlockchainAccountantTree extends InterfaceMerkleRadixTree{

    constructor (){
        super();

        this.autoMerklify = true;
        this.root.hash = {sha256: new Buffer(32) }

        this.emitter = new EventEmitter();
    }

    createNode(parent, edges, value){
        return new MiniBlockchainAccountantTreeNode(parent, edges, value);
    }

    /**
     *
     * @param input must be Base or Base String
     * @param value
     * @param tokenId
     * @returns {*}
     */
    updateAccount(input, value, tokenId){

        if (Buffer.isBuffer(input))
            input = BufferExtended.fromBase(input);

        let node = this.search(input).node;

        // in case it doesn't exist, let's create it
        if ( node === undefined || node === null){
            node = this.add(input, {balances: [] });
        }

        if (!node.isLeaf()) throw "couldn't delete because input is not a leaf node";

        let result = node.updateBalanceToken(value, tokenId);

        // it was deleted
        if (result === null){
            this.delete(input);
            this.emitter.emit("balances/changes/"+BufferExtended.toBase(input), result);
            return null;
        }

        this.changedNode( node );

        this.emitter.emit("balances/changes/"+BufferExtended.toBase(input), result);

        return result;
    }

    /**
     *
     * @param input must be Base or Base String
     * @returns {*}
     */
    listBalances(input){

        if (Buffer.isBuffer(input))
            input = BufferExtended.fromBase(input);

        let node = this.search(input).node;

        if (!node.isLeaf()) throw "couldn't delete because input is not a leaf node";

        return node.getBalances();

    }



    changedNode(node){

        // recalculate the balances

        InterfaceMerkleTree.prototype.changedNode.call(this, node); //computing hash
    }

    validateTree(node, callback){

        // if (!InterfaceAccountantRadixTree.prototype.validateTree.call(this, node, callback)) //verifying hash and propagating it
        //     return false;

        if (!InterfaceMerkleTree.prototype.validateTree.call(this, node)) //computing hash
            return false;

        return true;
    }

    checkInvalidNode(node){

        //if (!InterfaceAccountantRadixTree.prototype.checkInvalidNode.call(this, node)) return false;

        return InterfaceMerkleTree.prototype.checkInvalidNode.call(this, node);
    }

    validateHash(node){
        return InterfaceMerkleTree.prototype.validateHash.call(this, node);
    }

    /*
        inherited
    */
    _computeHash(node) {
        return InterfaceMerkleTree.prototype._computeHash.call(this, node);
    }

    refreshHash(node, forced){
        return InterfaceMerkleTree.prototype.refreshHash.call(this, node,forced);
    }

    getValueToHash(node){
        return node.serialize();
    }

}

export default MiniBlockchainAccountantTree