import Serialization from "../utils/Serialization";
import BufferExtended from "../utils/BufferExtended";
import InterfaceTreeEdge from "./Interface-Tree-Edge"

var uniqueId = 0;


class InterfaceTreeNode {

    // parent : Node
    // value : data
    // edges : [ of Edges]

    constructor(root, parent, edges, value){

        if (edges === undefined)
            edges = [];

        if (value === undefined)
            value = null;

        this.id = uniqueId++;

        this.root = root;

        this.parent = parent;

        this.edges = edges;

        this.value = value;
    }

    destroyNode(){

        for (let i=0; i<this.edges.length; i++) {
            this.edges[i].destroyEdge();
            this.edges[i] = undefined;
        }

        this.root = undefined;
        this.parent = undefined;

        delete this.value;
        delete this.edges
    }

    isLeaf(){
        return this.value !== null
    }

    serializeNodeData(){
        let buffer = [];

        if ( this.value !== undefined && Buffer.isBuffer(this.value) ) {
            buffer.push(Serialization.serializeNumber2Bytes(this.value.length));
            buffer.push( this.value );
        } else
            buffer.push (new Buffer(2));

        return Buffer.concat(buffer);
    }

    serializeNode(includeEdges){

        try {
            let buffer = this.serializeNodeData.apply(this, arguments);

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

        offset = offset || 0;


        let valueLength = Serialization.deserializeNumber2Bytes( buffer, offset );
        offset += 2;

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
                let length = Serialization.deserializeNumber1Bytes(buffer, offset);

                for (let i = 0; i < length; i++) {

                    let edge = new this.root.createNewEdge(null);
                    edge.deserializeEdge(buffer, offset, this.createNewNode);
                    this.edgesPush(edge);
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

    createNewNode(parent,  edges=[], value=null, hash = null){

        if (parent === undefined ) parent = this;
        return new this.constructor (this.root, parent, edges, value, hash);
    }

    validateTreeNode(){

        if ( this === undefined || this === null)
            throw {message: 'Tree Validation Errror. Node is null'};

        for (let i = 0; i < this.edges.length; i++) {

            if (  this.edges[i].targetNode === undefined || this.edges[i].targetNode === null )
                throw {message: 'Edge target node is Null', node: this, edge: this.edges[i], edgeIndex:i}

            if (this.edges[i].targetNode.parent !== this)
                throw {message:'Edge target node parent is different that current node', node:this};

        }

        return true;
    }

    /**
     * It will also Validate its children automatically
     */
    validateCompleteTreeNode(){

        if (!this.validateTreeNode()) return false;

        for (let i = 0; i < this.edges.length; i++) {
            if (!this.edges[i].targetNode.validateCompleteTreeNode())
                return false;
        }

        return true;
    }

    _changedNode(node){
        //no changes in a simple tree
    }

    //lexicographic order
    edgesPush(edge){

        let position = 0;

        if (typeof edge.label === "string" ) {
            for (let i = 0; i < this.edges.length; i++) {
                position = 0;
                while (position >= 0 && position < this.edges.length) {

                    if (edge.label > this.edges[position].label)
                        position++;
                    else
                        break
                }
            }
        } else if (Buffer.isBuffer(edge.label)){

            position = 0;
            while (position >= 0 && position < this.edges.length) {

                if (Buffer.compare(edge.label, this.edges[position].label) > 0)
                    position++;
                else
                    break
            }
        }

        this.edges.splice(position, 0, edge);

    }


}

export default InterfaceTreeNode;