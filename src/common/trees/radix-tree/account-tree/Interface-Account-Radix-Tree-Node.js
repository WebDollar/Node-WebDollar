import InterfaceRadixTreeNode from './../Interface-Radix-Tree-Node'

class InterfaceAccountRadixTreeNode extends InterfaceRadixTreeNode{

    constructor(parent, edges, value, sum){
        super (parent, edges, value);

        this.sum = sum;
    }



}

export default InterfaceAccountRadixTreeNode;