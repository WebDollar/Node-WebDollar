import InterfaceTreeNode from 'common/trees/Interface-Tree-Node'
import InterfaceRadixTreeEdge from "./Interface-Radix-Tree-Edge"
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";

class InterfaceRadixTreeNode extends InterfaceTreeNode{

    // parent : Node
    // value : data
    // edges : [ of Edges]

    constructor(root, parent, edges, value){
        super(root, parent, edges, value);
    }

    serializeNode(includeEdges){

        try {
            let buffer = [];

            buffer.push( this.serializeNodeData.apply(this, arguments) );

            if (includeEdges) {

                buffer.push(Serialization.serializeNumber1Byte(this.edges.length));

                for (let i = 0; i < this.edges.length; i++) {
                    buffer.push(Serialization.serializeNumber1Byte(this.edges[i].label.length));
                    buffer.push(this.edges[i].label);
                    buffer.push(this.edges[i].targetNode.serializeNode.apply(this.edges[i].targetNode, arguments));
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

                let length = buffer[offset]; //1 byte
                offset += 1;

                //console.log("length  length  ", length);

                for (let i = 0; i < length; i++) {

                    let valueLength = buffer[offset]; //1 byte
                    offset += 1;

                    let label = BufferExtended.substr(buffer, offset, valueLength);
                    offset += valueLength;

                    let targetNode = this.createNewNode();
                    arguments[1] = offset;
                    offset = targetNode.deserializeNode.apply(targetNode, arguments);

                    this.edges.push( this._createEdge(label, targetNode) );

                }

            }

            return offset;

        } catch (exception){
            console.log("Error deserializing Interface Radix Tree", exception);
            throw exception;
        }


    }

    _createEdge(label, targetNode){
        return new InterfaceRadixTreeEdge(label, targetNode);
    }

    _setNodeValue(value){
        this.value = value;
    }


}

export default InterfaceRadixTreeNode;