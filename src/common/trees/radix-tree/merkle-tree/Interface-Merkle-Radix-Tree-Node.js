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

    serializeNodeData(){

        return Buffer.concat ( [
            this.hash.sha256,
            InterfaceRadixTreeNode.prototype.serializeNodeData.call(this),
        ]);

    }


    deserializeNodeData(buffer, offset){

        let hashSha256 =  Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 32) );
        offset += 32;

        this.hash = {sha256: hashSha256};

        offset = InterfaceRadixTreeNode.prototype.deserializeNodeData.call(this, buffer, offset);

        return offset;
    }


}

export default InterfaceMerkleRadixTreeNode;