import InterfaceRadixTree from './../Interface-Radix-Tree'

import InterfaceAccountRadixTreeNode from './Interface-Accountant-Radix-Tree-Node'
import InterfaceRadixTreeEdge from './../Interface-Radix-Tree-Edge'

class InterfaceAccountantRadixTree extends InterfaceRadixTree{

    createNode(parent, edges, value, amount){
        return new InterfaceAccountRadixTreeNode(parent, edges, value, amount);
    }

    //createEdge() {} is inherited from Interface Radix Tree

    changedNode(node){
        // recalculate the balances
        this.refreshAccount(node);
    }

    validateAccount(node){

        //validate to up

        let initialAmount = null;

        if (typeof node.value === 'undefined' || node.value === null  || typeof node.value.amount === 'undefined' || node.value.amount === null )  return false;
        else {
            initialAmount = node.value.amount;
        }

        this._computeAccount(node);

        if (initialAmount === null && node.value.amount !== null) return false; // different amount
        if (initialAmount !== node.value.amount) return false; // different amount

        return true;
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

                if (typeof node.edges[i].targetNode.value === "undefined" || node.edges[i].targetNode.value === null || typeof node.edges[i].targetNode.value.amount === 'undefined' || node.edges[i].targetNode.value.amount === null)
                    amount += this._computeAccount(node.edges[i].targetNode);
                else
                    amount += node.edges[i].targetNode.value.amount;
            }

            node.value = node.value || {};
            node.value.amount = amount;
        } else {

            console.log("node.value", node.value);

            node.value = node.value || {};

            if (typeof node.value.amount === 'undefined' || node.value.amount === null)
                node.value.amount = 0;
        }

        return node.value.amount;
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