import InterfaceTreeNode from 'common/trees/Interface-Tree-Node'
import InterfaceRadixTreeEdge from "./Interface-Radix-Tree-Edge"
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";

class InterfaceRadixTreeNode extends InterfaceTreeNode{

    // parent : Node
    // value : data
    // edges : [ of Edges]

    constructor(parent, edges, value){

        super(parent, edges, value);

    }

    serializeNode(includeEdges){

        try {
            let buffer = [];

            buffer.push(this.serializeNodeData.apply(this, arguments));

            if (includeEdges) {

                buffer.push(Serialization.serializeNumber1Byte(this.edges.length));

                for (let i = 0; i < this.edges.length; i++) {
                    buffer.push(Serialization.serializeNumber1Byte(this.edges[i].label.length));
                    buffer.push(this.edges[i].label);
                    buffer.push(this.edges[i].targetNode.serializeNode.apply(arguments));
                }

            }

            return Buffer.concat(buffer);

        } catch (exception){
            console.log("Error serializing InterfaceRadixTreeNode", exception)
            throw exception;
        }
    }

    deserializeNode(buffer, offset, includeEdges, includeHashes){

        try {

            offset = this.deserializeNodeData.apply(this, arguments);

            if (includeEdges) {

                let length = Serialization.deserializeNumber(buffer[offset]);

                for (let i = 0; i < length; i++) {

                    let valueLength = Serialization.deserializeNumber(BufferExtended.substr(buffer, offset, 1));
                    offset += 1;

                    let value = Serialization.deserializeNumber(BufferExtended.substr(buffer, offset, valueLength));
                    offset += valueLength;

                }

            }

            return offset;

        } catch (exception){
            console.log("Error deserializing Interface Radix Tree", exception);
            throw exception;
        }
    }

    createEdge(node){
        return new InterfaceRadixTreeEdge(node, [], null);
    }

}

export default InterfaceRadixTreeNode;