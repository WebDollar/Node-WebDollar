import InterfaceTreeNode from './Interface-Tree-Node'

class InterfaceTreeEdge {

    // targetNode : Node

    constructor (targetNode) {

        if (targetNode === null)
            throw "Target Node is null";

        if ( targetNode instanceof InterfaceTreeNode === false )
            throw "Target Node is not a Node";

        this.targetNode = targetNode;

    }

    serializeEdge(){
        return Buffer.concat ( this.targetNode.serializeNode() );
    }

    deserializeEdge(buffer, offset, createNewNode){

        let node = createNewNode();
        offset = node.deserializeNode(buffer, offset, true);

        return offset;

    }

}


export default InterfaceTreeEdge;