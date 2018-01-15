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

    serializeNode(){

    }

    deserializeNode(buffer, offset){
        return offset;
    }

}

export default InterfaceTreeNode;