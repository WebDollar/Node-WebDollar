import InterfaceRadixTreeNode from './../Interface-Radix-Tree-Node'

class InterfaceAccountRadixTreeNode extends InterfaceRadixTreeNode{

    // value must contain .amount

    constructor(parent, edges, value, amount){

        super (parent, edges, value);

        this.amount = amount;

    }



}

export default InterfaceAccountRadixTreeNode;