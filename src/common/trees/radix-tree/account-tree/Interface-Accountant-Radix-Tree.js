import InterfaceRadixTree from './../Interface-Radix-Tree'

import InterfaceAccountRadixTreeNode from './Interface-Accountant-Radix-Tree-Node'
import InterfaceRadixTreeEdge from './../Interface-Radix-Tree-Edge'

class InterfaceAccountantRadixTree extends InterfaceRadixTree{

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
    _computeAccount(node){

        if (node === null || typeof node === 'undefined') throw "Couldn't compute the Amount because Node is empty";

        if (node.edges.length > 0){
            let amount = 0;
            for (let i=0; i<node.edges.length; i++){

                if (typeof node.edges[i].amount === 'undefined' || node.edges[i].amount === null)
                    amount += this._computeAccount(node.edges[i].targetNode);
                else
                    amount += node.edges[i].amount;
            }
        } else {
            if (typeof node.amount === 'undefined' || node.amount === null)
                node.amount = 0;
        }

        return node.amount;

    }

    refreshAccount(node, forced){

        if (node === null || typeof node === 'undefined') throw "Couldn't compute the Amount because Node is empty";

        let result = false;

        if ( typeof forced === "undefined" || forced === false ) result  = this.validateAccount(node); // in case it is not necessary to recalculate the hash by force

        // no changes...
        if (!result) {

            result = true;

            this._computeAccount(node)

            if (node.parent !== null)
                result = result && this.refreshAccount(node.parent, true)

        }

        return result;

    }

}

export default InterfaceAccountantRadixTree;