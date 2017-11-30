import InterfaceRadixTreeNode from './Interface-Radix-Tree-Node'

class InterfaceRadixTreeEdge{

    // label : data
    // targetNode : Node

    constructor (label, targetNode) {

        if (targetNode === null) throw "Target Node is null";
        if ( ! targetNode instanceof(InterfaceRadixTreeNode) ) throw "Target Node is not a Radix Node";


        this.label = label;
        this.targetNode = targetNode;

    }
}


export default InterfaceRadixTreeEdge;