import InterfaceRadixTree from './../Interface-Radix-Tree'
import InterfaceMerkleRadixTreeNode from './Interface-Merkle-Radix-Tree-Node'
import InterfaceMerkleTree from "common/trees/merkle-tree/Interface-Merkle-Tree";
/*
    Multiple inheritance Tutorial based on https://stackoverflow.com/questions/29879267/es6-class-multiple-inheritance

    const InterfaceMerkleTreeClass = (InterfaceMerkleTree) => class extends InterfaceMerkleTree{ };
*/

class InterfaceRadixMerkleTree extends InterfaceRadixTree {

    createRoot(){
        this.root = new InterfaceMerkleRadixTreeNode(null, null, [], null);
        this.root.autoMerklify = true;
        this.root.root = this.root;
    }


    _deserializeTree(buffer, offset, includeHashes){
        return InterfaceMerkleTree.prototype._deserializeTree.apply(this, arguments);
    }

    matches(tree){
        return InterfaceMerkleTree.prototype.matches.call(this,tree);
    }

}

export default InterfaceRadixMerkleTree;