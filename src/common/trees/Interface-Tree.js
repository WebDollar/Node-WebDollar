import InterfaceTreeEdge from './Interface-Tree-Edge';
import InterfaceTreeNode from './Interface-Tree-Node';

class InterfaceTree{

    constructor(){

        this.root = this.createNode(null, null, []);

    }

    createNode(){
        return new InterfaceTreeNode(arguments[0], arguments[1], arguments[2]);
    }

    createEdge(){
        return new InterfaceTreeEdge(arguments[0]);
    }

}

export default InterfaceTree