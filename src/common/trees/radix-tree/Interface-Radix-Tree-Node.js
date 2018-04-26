import InterfaceTreeNode from 'common/trees/Interface-Tree-Node'
import InterfaceRadixTreeEdge from "./Interface-Radix-Tree-Edge"
import Serialization from "common/utils/Serialization";
import BufferExtended from "common/utils/BufferExtended";
import consts from 'consts/const_global'
import Blockchain from "main-blockchain/Blockchain"

class InterfaceRadixTreeNode extends InterfaceTreeNode{

    // parent : Node
    // value : data
    // edges : [ of Edges]

    constructor(root, parent,  edges, value){
        super(root, parent,  edges, value);
    }

    serializeNode(includeEdges){

        try {
            let buffer = [];

            buffer.push( this.serializeNodeData.apply(this, arguments) );

            if (includeEdges) {

                buffer.push(Serialization.serializeNumber2Bytes(this.edges.length));

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

                let length ; //1 byte

                length = Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 2) ); //2 bytes
                offset += 2;


                for (let i = 0; i < length; i++) {

                    let valueLength = buffer[offset];
                    offset +=1;

                    let label = BufferExtended.substr(buffer, offset, valueLength);
                    offset += valueLength;

                    let targetNode = this.createNewNode();
                    this.edgesPush( this.root.createNewEdge(label, targetNode) );


                    arguments[1] = offset;
                    offset = targetNode.deserializeNode.apply(targetNode, arguments);

                }

            }

            return offset;

        } catch (exception){
            console.log("Error deserializing Interface Radix Tree", exception);
            throw exception;
        }


    }

    _setNodeValue(value){
        this.value = value;
    }


    createNewEdge(label, node){
        return new InterfaceRadixTreeEdge(label, node);
    }

}

export default InterfaceRadixTreeNode;