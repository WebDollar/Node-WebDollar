import InterfaceTreeNode from 'common/trees/Interface-Tree-Node'
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended"

class InterfaceMerkleTreeNode extends InterfaceTreeNode{

    // parent : Node
    // value : data
    // edges : [ of Edges]
    // hash

    constructor(parent, edges, value, hash){

        super(parent, edges, value);

        if (hash === undefined) hash = {sha256: new Buffer(32)}
        this.hash = hash;

    }

    serializeNodeData(){

        return Buffer.concat ( [
            this.hash.sha256,
            InterfaceTreeNode.prototype.serializeNodeData.apply(this, arguments),
        ]);

    }


    deserializeNodeData(buffer, offset){

        let hashSha256 =  BufferExtended.substr(buffer, offset, 32);
        offset += 32;

        this.hash = {sha256: hashSha256};

        arguments[1] = offset;
        offset = InterfaceTreeNode.prototype.deserializeNodeData.apply( this, arguments );

        return offset;
    }


}

export default InterfaceMerkleTreeNode;