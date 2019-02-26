import BufferExtended from "common/utils/BufferExtended"

import InterfaceTree from 'common/trees/Interface-Tree'
import InterfaceMerkleTreeNode from './Interface-Merkle-Tree-Node'

class InterfaceMerkleTree extends InterfaceTree{

    constructor(){
        super();
    }

    createRoot(){
        this.root = new InterfaceMerkleTreeNode(null, null,  [], null);
        this.root.autoMerklify = true;
        this.root.root = this.root;
    }


    _deserializeTree(buffer, offset, includeHashes){

        offset = InterfaceTree.prototype._deserializeTree.call(this, buffer, offset, includeHashes);

        if (includeHashes) {
            if (!this.validateRoot(includeHashes))
                throw {message: "Refresh Hash didn't work"};
        }
        else { //let's recalculate
            if (! this.root._refreshHash(true) )
                throw {message: "Refresh Hash2 didn't work"};
        }

        return offset;
    }

    /**
     * Verify two trees and its hashes
     * @param tree
     * @returns boolean
     */
    matches(tree){

        let result = this.validateRoot();
        result = result && tree.validateRoot();

        result = result && BufferExtended.safeCompare(this.root.hash, tree.root.hash);

        return result;
    }

}

export default InterfaceMerkleTree