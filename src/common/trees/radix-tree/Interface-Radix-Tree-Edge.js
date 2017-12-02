import InterfaceTreeEdge from 'common/trees/Interface-Tree-Edge'

class InterfaceRadixTreeEdge extends InterfaceTreeEdge {

    // label : data
    // targetNode : Node

    constructor (label, targetNode) {

        if ( ! targetNode instanceof(InterfaceRadixTreeEdge) ) throw "Target Node is not a Radix Node";

        super(targetNode)

        this.label = label;

    }
}


export default InterfaceRadixTreeEdge;