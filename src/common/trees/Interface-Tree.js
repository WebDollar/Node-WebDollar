import InterfaceTreeEdge from './Interface-Tree-Edge';
import InterfaceTreeNode from './Interface-Tree-Node';
import WebDollarCryptoData from "../crypto/Webdollar-Crypto-Data";

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

    changedNode(node){
        //no changes in a simple tree
    }

    add(data){

        data = WebDollarCryptoData.createWebDollarCryptoData(data);
        let node = this.createNode(this.root, data, [])

        this.changedNode(node);
        return node;
    }

    delete(node){

        node.value = null;
        let deleted = false;

        let nodeParent = node.parent;
        while (nodeParent !== null && node.value === null){

            for (let i=0; i<nodeParent.edges.length; i++)
                if (nodeParent.edges[i].targetNode === node){
                    nodeParent.edges.splice(i,1);
                    deleted = true;
                    break;
                }

            if (nodeParent.edges.length === 0){
                node = nodeParent;
            }
        }

        if (deleted) {
            this.changedNode(node)
            return true;
        }
        return false;

    }

    search(){

    }

    save(){
    }

    load(){
    }

    toJSON(){

    }

    toString(){

    }

}

export default InterfaceTree