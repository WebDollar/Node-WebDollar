import InterfaceTreeEdge from 'common/trees/Interface-Tree-Edge'
import InterfaceRadixTreeNode from 'common/trees/Interface-Tree-Node'

class InterfaceRadixTreeEdge extends InterfaceTreeEdge {

    // label : data
    // targetNode : Node

    constructor (label, targetNode) {

        if ( targetNode instanceof InterfaceRadixTreeNode === false ) throw "Target Node is not a Radix Node";

        super ( targetNode );

        this.label = label;

    }
}


export default InterfaceRadixTreeEdge;