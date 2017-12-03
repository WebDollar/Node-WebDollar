import InterfaceRadixTree from './../Interface-Radix-Tree'

import InterfaceAccountRadixTreeNode from './Interface-Account-Radix-Tree-Node'
import InterfaceRadixTreeEdge from './../Interface-Radix-Tree-Edge'

class InterfaceAccountRadixTree extends InterfaceRadixTree{

    createNode(parent, edges, value, amount){
        return new InterfaceAccountRadixTreeNode(parent, edges, value, amount);
    }

    //createEdge() {} is inherited from Interface Radix Tree

    changedNode(node){
        // validate the balances
    }

    add(input, value, amount ){
        return InterfaceRadixTree.prototype.add(input, value, amount);
    }

    /**
     * Compute the Accountant based on his children
     * @param node
     */
    computeAccount(node){

        if (node === null || typeof node === 'undefined') throw "Couldn't compute the Amount because Node is empty";

        if (node.edges.length > 0){
            let amount = 0;
            for (let i=0; i<node.edges.length; i++){

                if (typeof node.edges[i].amount === 'undefined' || node.edges[i].amount === null)
                    amount += this.calculateAccount(node.edges[i].targetNode);
                else
                    amount += node.edges[i].amount;
            }
        } else {
            if (typeof node.amount === 'undefined' || node.amount === null)
                node.amount = 0;
        }

        return node.amount;

    }

    calculateAccount(node){

        if (node === null || typeof node === 'undefined') throw "Couldn't compute the Amount because Node is empty";

        let amount = 0;
        for (let i=0; i<node.edges.length; i++){
            amount += this.recalculateAccount(node.edges[i].targetNode);
        }



    }

}

export default InterfaceAccountRadixTree;