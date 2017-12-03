import InterfaceRadixTreeNode from './../Interface-Radix-Tree-Node'

class InterfaceAccountRadixTreeNode extends InterfaceRadixTreeNode{

    // value must contain .amount

    constructor(parent, edges, value){

        if (value !== null)
            if (typeof value.amount === "undefined" || value.amount === null) throw "value.amount is undefined";

        super (parent, edges, value);
    }



}

export default InterfaceAccountRadixTreeNode;