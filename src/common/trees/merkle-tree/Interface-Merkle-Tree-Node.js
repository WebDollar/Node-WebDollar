import InterfaceTreeNode from 'common/trees/Interface-Tree-Node'


class InterfaceMerkleTreeNode extends InterfaceTreeNode{

    // parent : Node
    // value : data
    // edges : [ of Edges]
    // hash

    constructor(parent, edges, value, hash){

        super(parent, edges, value);

        this.hash = hash;

    }

}

export default InterfaceMerkleTreeNode;