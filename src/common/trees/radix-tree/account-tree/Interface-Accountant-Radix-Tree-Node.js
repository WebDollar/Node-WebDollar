import InterfaceRadixTreeNode from './../Interface-Radix-Tree-Node'

class InterfaceAccountRadixTreeNode extends InterfaceRadixTreeNode{

    // value must contain .amount

    constructor(parent, edges, value){

        super (parent, edges, value);

    }



}

export default InterfaceAccountRadixTreeNode;