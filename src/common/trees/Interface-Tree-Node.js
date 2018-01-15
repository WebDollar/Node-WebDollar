import Serialization from "../utils/Serialization";
import BufferExtended from "../utils/BufferExtended";

var uniqueId = 0;


class InterfaceTreeNode {

    // parent : Node
    // value : data
    // edges : [ of Edges]

    constructor(parent, edges, value){

        if (edges === undefined) edges = [];
        if (value === undefined) value = null;

        this.id = uniqueId++;

        this.parent = parent;
        this.edges = edges;

        this.value = value;

    }

    isLeaf(){

        return this.value !== null
    }

    serializeNode(includeEdges){

        let buffer = [];

        if (includeEdges) {

            buffer.push(Serialization.serializeNumber1Byte(this.edges.length));
            for (let i = 0; i < this.edges.length; i++) {

                buffer.push(this.edges[i].serializeNode(includeEdges));
            }

        }

        return Buffer.concat(buffer);
    }

    deserializeNode(buffer, offset, includeEdges){

        if (includeEdges){

            let length = Serialization.deserializeNumber(buffer[offset]);

            for (let i=0; i<length; i++){

                let node = new this.constructor (this,[],null);

                node.deserializeNode(buffer, offset, true);
                let value =  Serialization.deserializeNumber( BufferExtended.substr(buffer, offset, valueLength) );
                offset += valueLength;

                let
            }

        }

        return offset;
    }

    createEdge(label, node){

        return new InterfaceTreeEdge(node);

    }

}

export default InterfaceTreeNode;