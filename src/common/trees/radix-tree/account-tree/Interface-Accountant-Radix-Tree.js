var BigNumber = require('bignumber.js');

import InterfaceRadixTree from './../Interface-Radix-Tree'

import InterfaceAccountRadixTreeNode from './Interface-Accountant-Radix-Tree-Node'
import InterfaceRadixTreeEdge from './../Interface-Radix-Tree-Edge'

class InterfaceAccountantRadixTree extends InterfaceRadixTree{

    createNode(parent, edges, value, amount){
        //console.log("amount", amount)
        return new InterfaceAccountRadixTreeNode(parent, edges, value, amount);
    }

    setNode(node, value, amount){
        InterfaceRadixTree.prototype.setNode(this, node, value);
        node.setAmount(amount);
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

        if (node.isAmountValid() === false)  return false;
        if (node.amount.lessThan ( 0 ) ) return false;



        return true;

    }

    validateTree(node){

        let result = InterfaceRadixTree.prototype.validateTree.call(this, node, this.validateAccount);
        if (!result) return false;

        return true;
    }

    validateAccount(node){

        //validate bottom to up

        let initialAmount = null;

        if ( node.isAmountValid() === false)  return false;
        else
            initialAmount = node.amount;

        this._computeAccount(node);

        if ( node.isAmountValid() === false ) return false;
        if ( initialAmount.equals(node.amount) === false ) return false; // different amount

        return true;
    }

    /**
     * Compute the Accountant based on his children
     * @param node
     */
    _computeAccount(node){

        if (node === null || typeof node === 'undefined') throw "Couldn't compute the Amount because Node is empty";

        if ( node.edges.length > 0 ){

            let amount = new BigNumber(0);

            for (let i=0; i<node.edges.length; i++){

                if (typeof node.edges[i].targetNode.value === "undefined" || node.edges[i].targetNode.value === null || node.edges[i].targetNode.isAmountValid() === false )
                    amount = amount.plus(this._computeAccount(node.edges[i].targetNode));
                else
                    amount = amount.plus(node.edges[i].targetNode.amount);
            }

            node.amount = amount;
        } else {

            if ( node.isAmountValid() === false )
                node.amount = new BigNumber(0);
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