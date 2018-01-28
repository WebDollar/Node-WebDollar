import Serialization from "../utils/Serialization";
import BufferExtended from "../utils/BufferExtended";
import InterfaceTreeEdge from "./Interface-Tree-Edge"

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

    serializeNodeData(){
        buffer.push(Serialization.serializeNumber2Bytes(this.value.length));
        buffer.push(this.value);
    }

    serializeNode(includeEdges){

        try {
            let buffer = [];

            this.serializeNodeData.apply(arguments);

            if (includeEdges) {

                buffer.push(Serialization.serializeNumber1Byte(this.edges.length));
                for (let i = 0; i < this.edges.length; i++) {

                    buffer.push(this.edges[i].serializeEdge())

                }

            }

            return Buffer.concat(buffer);

        } catch (exception){
            console.log("Error serializing TreeNode", exception)
            throw exception;
        }
    }

    deserializeNodeData(buffer, offset){


        let valueLength = Serialization.deserializeNumber(BufferExtended.substr(buffer, offset, 1));
        offset += 1;

        let value = Serialization.deserializeNumber(BufferExtended.substr(buffer, offset, valueLength));
        offset += valueLength;

        this.value = value;

        return offset;


    }

    deserializeNode(buffer, offset, includeEdges, includeHashes){

        try {
            offset = this.deserializeNodeData.apply(this, arguments);

            if (includeEdges) {

                //1 byte
                let length = Serialization.deserializeNumber(buffer[offset]);

                for (let i = 0; i < length; i++) {

                    let edge = new this.createNewEdge(null);
                    edge.deserializeEdge(buffer, offset, this.createNewNode);
                    this.edges.push(edge);
                }

            }

            return offset;

        } catch (exception){
            console.log("Error deserializing TreeNode", exception)
            throw exception;
        }
    }

    createNewEdge(node){
        return new InterfaceTreeEdge(node);
    }

    createNewNode(){
        return new this.constructor (this,[],null);
    }

}

export default InterfaceTreeNode;