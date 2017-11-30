
class InterfaceRadixTreeNode{

    // parent : Node
    // value : data
    // edges : [ of Edges]

    constructor(parent, value, edges){

        if (typeof edges === "undefined") edges = [];
        if (typeof value === "undefined") value = null;

        this.parent = parent;
        this.value = value;
        this.edges = edges;

    }

}

export default InterfaceRadixTreeNode;