import InterfaceRadixTree from './../Interface-Radix-Tree'

import InterfaceRadixTreeEdge from './../Interface-Radix-Tree-Edge'
import InterfaceRadixTreeNode from './../Interface-Radix-Tree-Node'
import InterfaceMerkleTree from './../../merkle-tree/Interface-Merkle-Tree'

/*
    Multiple inheritance Tutorial based on https://stackoverflow.com/questions/29879267/es6-class-multiple-inheritance

    const InterfaceMerkleTreeClass = (InterfaceMerkleTree) => class extends InterfaceMerkleTree{ };
*/

class InterfaceRadixMerkleTree extends InterfaceRadixTree {

    constructor(db){
        super(db);

        this.autoMerklify = true;
        this.root.hash = {sha256: new Buffer(32) }
    }

    _changedNode(node){

        InterfaceMerkleTree.prototype._changedNode.call(this, node); //computing hash
        InterfaceRadixTree.prototype._changedNode.call(this, node); //verifying hash and propagating it
    }

    validateTree(node, callback){

        if (!InterfaceRadixTree.prototype.validateTree.call(this, node, callback)) //verifying hash and propagating it
            return false;

        if (!InterfaceMerkleTree.prototype.validateTree.call(this, node)) //computing hash
            return false;

        return true;
    }

    _checkInvalidNode(node){

        if (!InterfaceRadixTree.prototype._checkInvalidNode.call(this, node)) return false;

        return InterfaceMerkleTree.prototype._checkInvalidNode.call(this, node);
    }

    /*
        inherited
    */
    _validateHash(node){
        return InterfaceMerkleTree.prototype._validateHash.call(this, node);
    }

    _computeHash(node) {
        return InterfaceMerkleTree.prototype._computeHash.call(this, node);
    }

    _refreshHash(node, forced){
        return InterfaceMerkleTree.prototype._refreshHash.call(this, node,forced);
    }

    _getValueToHash(node){
        return InterfaceMerkleTree.prototype._getValueToHash.call(this, node);
    }

    deserializeTree(buffer, offset, includeHashes){

        offset = InterfaceRadixTree.prototype.deserializeTree.call(this, buffer, offset, includeHashes);

        //console.log("deserializeTree completed", buffer);

        if (! this._refreshHash(this.root, true) )
            throw "Refresh Hash didn't work";

        return offset;
    }

    matches(tree){
        return InterfaceMerkleTree.prototype.matches.call(this,tree);
    }

}

export default InterfaceRadixMerkleTree;