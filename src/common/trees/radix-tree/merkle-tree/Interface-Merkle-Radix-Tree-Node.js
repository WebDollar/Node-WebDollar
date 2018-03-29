import InterfaceRadixTreeNode from 'common/trees/radix-tree/Interface-Radix-Tree-Node'
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";
import InterfaceMerkleTreeNode from "common/trees/merkle-tree/Interface-Merkle-Tree-Node"

class InterfaceMerkleRadixTreeNode extends InterfaceRadixTreeNode{

    // parent : Node
    // value : data
    // edges : [ of Edges]
    // hash

    constructor(parent, edges, value, hash){

        super(parent, edges, value);

        this.hash = hash;

    }

    serializeNodeDataHash(includeHashes){

        if (includeHashes)
            return this.hash.sha256;
        else
            return null;
    }

    serializeNodeData(includeEdges, includeHashes){

        let list = [];

        let hash = this.serializeNodeDataHash(includeHashes);

        if (hash !== null)
            list.push(hash);

        list.push(InterfaceRadixTreeNode.prototype.serializeNodeData.apply(this, arguments));

        return Buffer.concat ( list );
    }

    deserializeNodeDataHash(buffer, offset, includeEdges, includeHashes){

        offset = offset || 0;

        //console.log("deserializeNodeData includeHashes", includeHashes)
        if (includeHashes) {

            let hashSha256 = BufferExtended.substr(buffer, offset, 32);
            offset += 32;

            this.hash = {sha256: hashSha256};

        }
        //console.log("deserializeNodeData includeHashes", this.hash.sha256.toString("hex"))
        return offset;
    }

    deserializeNodeData(buffer, offset, includeEdges, includeHashes){

        offset = this.deserializeNodeDataHash.apply(this, arguments);

        arguments[1] = offset;
        offset = InterfaceRadixTreeNode.prototype.deserializeNodeData.apply(this, arguments);

        return offset;
    }

    validateTreeNode() {

        if (!InterfaceRadixTreeNode.prototype.validateTreeNode.apply(this, arguments)) return false;

        if (!InterfaceMerkleTreeNode.prototype.validateTreeNode.apply(this, arguments)) return false;

    }

}

export default InterfaceMerkleRadixTreeNode;