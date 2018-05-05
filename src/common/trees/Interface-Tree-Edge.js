import InterfaceTreeNode from './Interface-Tree-Node'

class InterfaceTreeEdge {

    // targetNode : Node

    constructor (targetNode) {

        if (targetNode === null)
            throw {message: "Target Node is null"};

        if ( targetNode instanceof InterfaceTreeNode === false )
            throw {message: "Target Node is not a Node"};

        this.targetNode = targetNode;

    }

    destroyEdge(){

        if (this.targetNode !== undefined && this.targetNode !== null)
            this.targetNode.destroyNode();

        this.targetNode = undefined;
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