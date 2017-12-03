
class InterfaceTreeNode {

    // parent : Node
    // value : data
    // edges : [ of Edges]

    constructor(parent, edges, value){

        if (typeof edges === "undefined") edges = [];
        if (typeof value === "undefined") value = null;

        this.parent = parent;
        this.edges = edges;

        this.value = value;

    }

}

export default InterfaceTreeNode;