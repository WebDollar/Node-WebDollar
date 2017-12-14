import InterfaceTreeNode from './Interface-Tree-Node'

class InterfaceTreeEdge {

    // targetNode : Node

    constructor (targetNode) {

        if (targetNode === null) throw "Target Node is null";

        if ( targetNode instanceof InterfaceTreeNode === false ) throw "Target Node is not a Node";

        this.targetNode = targetNode;

    }
}


export default InterfaceTreeEdge;