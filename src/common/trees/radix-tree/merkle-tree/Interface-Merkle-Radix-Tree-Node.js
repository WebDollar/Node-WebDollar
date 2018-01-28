import InterfaceRadixTreeNode from 'common/trees/radix-tree/Interface-Radix-Tree-Node'
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";


class InterfaceMerkleRadixTreeNode extends InterfaceRadixTreeNode{

    // parent : Node
    // value : data
    // edges : [ of Edges]
    // hash

    constructor(parent, edges, value, hash){

        super(parent, edges, value);

        this.hash = hash;

    }

    serializeNodeData(includeEdges, includeHashes){

        let list = [];

        if (includeHashes)
            list.push(this.hash.sha256);

        list.push(InterfaceRadixTreeNode.prototype.serializeNodeData.apply(this, arguments));

        return Buffer.concat ( list );

    }


    deserializeNodeData(buffer, offset, includeEdges, includeHashes){

        if (includeHashes) {

            let hashSha256 = Serialization.deserializeNumber(BufferExtended.substr(buffer, offset, 32));
            offset += 32;

            this.hash = {sha256: hashSha256};

        }

        arguments[1] = offset;
        offset = InterfaceRadixTreeNode.prototype.deserializeNodeData.apply(this, arguments);

        return offset;
    }


}

export default InterfaceMerkleRadixTreeNode;