const classes = require('extends-classes');

import InterfaceRadixTree from './../Interface-Radix-Tree'

import InterfaceRadixTreeEdge from './../Interface-Radix-Tree-Edge'
import InterfaceRadixTreeNode from './../Interface-Radix-Tree-Node'
import InterfaceMerkleTree from './../../merkle-tree/Interface-Merkle-Tree'

/*
    Multiple inheritance Tutorial based on https://stackoverflow.com/questions/29879267/es6-class-multiple-inheritance
*/

const InterfaceMerkleTreeClass = (InterfaceMerkleTree) => class extends InterfaceMerkleTree{
};

class InterfaceRadixMerkleTree extends InterfaceRadixTree {

    constructor(){
        super();

        console.log(this);
        console.log(this.validateHash)
    }

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

    validateHash(node){
        InterfaceMerkleTree.prototype.validateHash.call(this, node);
    }

    _computeHash(node) {
        InterfaceMerkleTree.prototype._computeHash.call(this, node);
    }

    refreshHash(node, forced){
        InterfaceMerkleTree.prototype.refreshHash.call(this, node,forced);
    }

    getValueToHash(node){
        InterfaceMerkleTree.prototype.getValueToHash.call(this, node);
    }


}

export default InterfaceRadixMerkleTree;