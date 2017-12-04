import InterfaceTreeNode from 'common/trees/Interface-Tree-Node'


class InterfaceRadixTreeNode extends InterfaceTreeNode{

    // parent : Node
    // value : data
    // edges : [ of Edges]

    constructor(parent, edges, value){

        super(parent, edges, value);

    }

}

export default InterfaceRadixTreeNode;