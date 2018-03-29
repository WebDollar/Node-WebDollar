import InterfaceRadixTree from 'common/trees/radix-tree/Interface-Radix-Tree'
import InterfaceAccountantRadixTree from 'common/trees/radix-tree/accountant-tree/Interface-Accountant-Radix-Tree'
import InterfaceMerkleTree from 'common/trees/merkle-tree/Interface-Merkle-Tree'

class InterfaceRadixMerkleTree extends InterfaceAccountantRadixTree {

    constructor(){
        super();
    }

    _changedNode(node){

        // recalculate the balances
        this.refreshAccount(node, true);

        InterfaceMerkleTree.prototype._changedNode.call(this, node); //computing hash

        InterfaceRadixTree.prototype._changedNode.call(this, node); //verifying hash and propagating it
    }

    _checkInvalidNode(node){

        if (!InterfaceAccountantRadixTree.prototype._checkInvalidNode.call(this, node))
            return false;

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




}

export default InterfaceRadixMerkleTree;