var BigNumber = require('bignumber.js');

import InterfaceRadixTree from './../Interface-Radix-Tree'

import InterfaceAccountRadixTreeNode from './Interface-Accountant-Radix-Tree-Node'
import InterfaceRadixTreeEdge from './../Interface-Radix-Tree-Edge'

class InterfaceAccountantRadixTree extends InterfaceRadixTree{

    createNode(parent, edges, value){
        //console.log("amount", amount)
        return new InterfaceAccountRadixTreeNode(parent, edges, value);
    }

    setNode(node, value){
        InterfaceRadixTree.prototype.setNode(this, node);
        node.setValue(value);
    }

    changedNode(node){
        // recalculate the balances
        this.refreshAccount(node, true);

        InterfaceRadixTree.prototype.changedNode.call(this, node);
    }

    checkInvalidNode(node){

        if (!InterfaceRadixTree.prototype.checkInvalidNode.call(this, node))
            return false;

        //it should have a valid value


        if (node.isSumValid() === false)  return false;
        if (node.sum.lessThan ( 0 ) ) return false;

        if (node.isLeaf() && (node.isBalanceValid() === false ) ) return false;
        if (node.isBalanceValid() && node.value.balance.lessThan ( 0 )) return false;

        return true;
    }

    validateTree(node){

        let result = InterfaceRadixTree.prototype.validateTree.call(this, node, this.validateAccount);
        if (!result) return false;

        return true;
    }

    validateAccount(node){

        //validate bottom to up

        let initialSum = null;

        if ( node.isSumValid() === false)  return false;
        else
            initialSum = node.sum;

        this._computeAccount(node);

        if ( node.isSumValid() === false ) return false;
        if ( initialSum.equals(node.sum) === false ) return false; // different sum

        return true;
    }

    /**
     * Compute the Accountant based on his children
     * @param node
     */
    _computeAccount(node){

        if (node === null || typeof node === 'undefined') throw "Couldn't compute the Sum because Node is empty";


        let sum;

        if ( node.isBalanceValid()  )
            sum = node.value.balance;
        else
            sum = new BigNumber(0);


        if ( node.edges.length > 0 ){

            for (let i=0; i<node.edges.length; i++){

                if (node.edges[i].targetNode.isSumValid() === false )
                    sum = sum.plus(this._computeAccount(node.edges[i].targetNode));
                else
                    sum = sum.plus(node.edges[i].targetNode.sum);
            }


        }

        node.sum = sum;

        return node.sum;
    }

    refreshAccount(node, forced){

        if (node === null || typeof node === 'undefined') throw "Couldn't compute the Sum because Node is empty";

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