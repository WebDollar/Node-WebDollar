import InterfaceTreeNode from 'common/trees/Interface-Tree-Node'


class InterfaceRadixTreeNode extends InterfaceTreeNode{

    // parent : Node
    // value : data
    // edges : [ of Edges]

    constructor(parent, value, edges){

        super(parent, value, edges)

    }

}

export default InterfaceRadixTreeNode;