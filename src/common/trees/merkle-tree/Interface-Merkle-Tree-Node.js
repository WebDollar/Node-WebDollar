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

        if (hash === undefined)
            hash = {sha256: new Buffer(32)};

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


    validateTreeNode(){

        let answer = InterfaceTreeNode.prototype.validateTreeNode.apply(this, arguments);

        if (!answer) return false;

        if (typeof this.hash !== "object" || typeof this.hash.sha256 !== "object") return false;

        if ( !Buffer.isBuffer(this.hash.sha256) || this.hash.sha256.length !== 32 ) false;

        return true;

    }


}

export default InterfaceMerkleTreeNode;