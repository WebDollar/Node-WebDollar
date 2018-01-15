import InterfaceTreeNode from 'common/trees/Interface-Tree-Node'
import InterfaceRadixTreeEdge from "./Interface-Radix-Tree-Edge"

class InterfaceRadixTreeNode extends InterfaceTreeNode{

    // parent : Node
    // value : data
    // edges : [ of Edges]

    constructor(parent, edges, value){

        super(parent, edges, value);

    }

    serializeNode(includeEdges){

        let buffer = [];

        if (includeEdges) {

            buffer.push(Serialization.serializeNumber1Byte(this.edges.length));
            for (let i = 0; i < this.edges.length; i++) {
                buffer.push(this.edges[i].value.length);
                buffer.push(this.edges[i].value);
                buffer.push(this.edges[i].serializeNode(includeEdges));
            }

        }

        return Buffer.concat(buffer);
    }

    deserializeNode(buffer, offset, includeEdges){

        if (includeEdges){

            let length = Serialization.deserializeNumber(buffer[offset]);

            for (let i=0; i<length; i++){

                let valueLength =  Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, 1) );
                offset += 1;

                let value =  Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, valueLength) );
                offset += valueLength;

                let
            }

        }

        return offset;
    }

    createEdge(node){
        return new InterfaceRadixTreeEdge(node, [], null);
    }

}

export default InterfaceRadixTreeNode;