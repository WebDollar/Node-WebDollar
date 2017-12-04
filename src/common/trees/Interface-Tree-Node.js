var uniqueId = 0;


class InterfaceTreeNode {

    // parent : Node
    // value : data
    // edges : [ of Edges]

    constructor(parent, edges, value){

        if (typeof edges === "undefined") edges = [];
        if (typeof value === "undefined") value = null;

        this.id = uniqueId++;

        this.parent = parent;
        this.edges = edges;

        this.value = value;

    }

    isLeaf(){

        return (typeof this.edges !== 'undefined' && this.edges !== null && this.edges.length === 0)

    }

}

export default InterfaceTreeNode;