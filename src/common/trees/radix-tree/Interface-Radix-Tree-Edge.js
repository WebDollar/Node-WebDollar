import InterfaceTreeEdge from 'common/trees/Interface-Tree-Edge'
import InterfaceRadixTreeNode from 'common/trees/Interface-Tree-Node'
import Serialization from "../../utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";

class InterfaceRadixTreeEdge extends InterfaceTreeEdge {

    // label : data
    // targetNode : Node

    constructor (label, targetNode) {

        if ( targetNode instanceof InterfaceRadixTreeNode === false ) throw "Target Node is not a Radix Node";

        super ( targetNode );

        this.label = label;
    }

    serializeEdge(){

        return Buffer.concat ( [
            Serialization.serializeNumber1Byte(this.label.length),
            this.label,
            this.targetNode.serializeNode()
        ]);

    }

    deserializeEdge(buffer, offset, createNewNode){

        let labelLength = Serialization.deserializeNumber(buffer[offset]);
        offset +=1;

        this.label =  BufferExtended.substr(buffer, offset, labelLength);

        let node = createNewNode();
        offset = node.deserializeNode(buffer, offset, true);

        return offset;

    }

}


export default InterfaceRadixTreeEdge;