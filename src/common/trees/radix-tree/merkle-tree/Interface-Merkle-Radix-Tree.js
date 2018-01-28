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

    changedNode(node){

        InterfaceMerkleTree.prototype.changedNode.call(this, node); //computing hash
        InterfaceRadixTree.prototype.changedNode.call(this, node); //verifying hash and propagating it
    }

    validateTree(node, callback){

        if (!InterfaceRadixTree.prototype.validateTree.call(this, node, callback)) //verifying hash and propagating it
            return false;

        if (!InterfaceMerkleTree.prototype.validateTree.call(this, node)) //computing hash
            return false;

        return true;
    }

    checkInvalidNode(node){

        if (!InterfaceRadixTree.prototype.checkInvalidNode.call(this, node)) return false;

        return InterfaceMerkleTree.prototype.checkInvalidNode.call(this, node);
    }

    /*
        inherited
    */
    validateHash(node){
        return InterfaceMerkleTree.prototype.validateHash.call(this, node);
    }

    _computeHash(node) {
        return InterfaceMerkleTree.prototype._computeHash.call(this, node);
    }

    refreshHash(node, forced){
        return InterfaceMerkleTree.prototype.refreshHash.call(this, node,forced);
    }

    getValueToHash(node){
        return InterfaceMerkleTree.prototype.getValueToHash.call(this, node);
    }

    deserializeTree(buffer, offset, includeHashes){

        offset = InterfaceRadixTree.prototype.deserializeTree.call(this, buffer, offset, includeHashes);

        //console.log("deserializeTree completed", buffer);

        if (! this.refreshHash(this.root, true) )
            throw "Refresh Hash didn't work";

        return offset;
    }

    matches(tree){
        return InterfaceMerkleTree.prototype.matches.call(this,tree);
    }

}

export default InterfaceRadixMerkleTree;