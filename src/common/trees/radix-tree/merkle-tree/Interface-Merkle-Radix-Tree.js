const classes = require('extends-classes');

import InterfaceRadixTree from './../Interface-Radix-Tree'

import InterfaceRadixTreeEdge from './../Interface-Radix-Tree-Edge'
import InterfaceRadixTreeNode from './../Interface-Radix-Tree-Node'
import InterfaceMerkleTree from './../../merkle-tree/Interface-Merkle-Tree'

class InterfaceRadixMerkleTree extends InterfaceRadixTree{

    setNode(node, value){
        InterfaceRadixTree.prototype.setNode(this, node);
    }

    changedNode(node){

        InterfaceMerkleTree.prototype.refreshHash.call(this, node); //computing hash
        InterfaceRadixTree.prototype.changedNode.call(this, node); //verifying hash and propagating it
    }

    validateTree(node){
        if (!InterfaceRadixTree.prototype.validateTree.call(this, node)); //verifying hash and propagating it
            return false;

        if (!InterfaceMerkleTree.prototype.validateTree.call(this, node)); //computing hash
            return false;
    }

    checkInvalidNode(node){

        if (!InterfaceRadixTree.prototype.checkInvalidNode.call(this, node)) return false;

        //it should have a valid hash

        if (typeof node.hash === 'undefined' || node.hash === null) return false;

        return true;
    }


}

export default InterfaceRadixMerkleTree;