import InterfaceTreeNode from 'common/trees/Interface-Tree-Node'
import Serialization from "../../utils/Serialization";


class InterfaceMerkleTreeNode extends InterfaceTreeNode{

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
            InterfaceTreeNode.prototype.serializeNodeData.call(this),
            ]);

    }


    deserializeNodeData(buffer, offset){

        let hashSha256 =  Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 32) );
        offset += 32;

        this.hash = {sha256: hashSha256}

        offset = InterfaceTreeNode.prototype.deserializeNodeData.call(this, buffer, offset);

        return offset;
    }


}

export default InterfaceMerkleTreeNode;