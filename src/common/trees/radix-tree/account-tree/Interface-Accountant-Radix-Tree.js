import InterfaceRadixTree from './../Interface-Radix-Tree'

import InterfaceAccountRadixTreeNode from './Interface-Accountant-Radix-Tree-Node'
import InterfaceRadixTreeEdge from './../Interface-Radix-Tree-Edge'

class InterfaceAccountantRadixTree extends InterfaceRadixTree{

    createNode(parent, edges, value, amount){
        console.log("amount", amount)
        return new InterfaceAccountRadixTreeNode(parent, edges, value, amount);
    }

    changedNode(node){
        // recalculate the balances
        this.refreshAccount(node);

        InterfaceRadixTree.prototype.changedNode.call(this, node);
    }

    validateNode(node){

        let result = InterfaceRadixTree.prototype.validateNode.call(this, node);
        if (!result ) return false;

        //it should have a valid value

        if (node.amount === null || typeof node.amount === 'undefined')  return false;
        if (node.amount < 0) return false;



        return true;

    }

    // validateTree(node){
    //
    // }

    validateAccount(node){

        //validate bottom to up

        let initialAmount = null;

        if (typeof node.amount !== 'number' || node.amount === null )  return false;
        else {
            initialAmount = node.amount;
        }

        this._computeAccount(node);

        if (typeof initialAmount !== 'number' || typeof node.amount !== 'number') return false;
        if (initialAmount === null || node.amount !== null) return false; // different amount
        if (initialAmount !== node.amount) return false; // different amount

        return true;
    }

    /**
     * Compute the Accountant based on his children
     * @param node
     */
    _computeAccount(node){

        if (node === null || typeof node === 'undefined') throw "Couldn't compute the Amount because Node is empty";

        if ( !node.isLeaf() ){
            let amount = 0;
            for (let i=0; i<node.edges.length; i++){

                if (typeof node.edges[i].targetNode.value === "undefined" || node.edges[i].targetNode.value === null || typeof node.edges[i].targetNode.amount !== 'number' || node.edges[i].targetNode.amount === null)
                    amount += this._computeAccount(node.edges[i].targetNode);
                else
                    amount += node.edges[i].targetNode.amount;
            }

            node.amount = 0||amount;
        } else {

            if (typeof node.amount !== 'number' || node.amount === null)
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

            if (node.parent !== null) {

                if (!this.validateAccount(node.parent))
                    result = result && this.refreshAccount(node.parent, true)

            }

        }


        return result;

    }

}

export default InterfaceAccountantRadixTree;