var BigNumber = require('bignumber.js');

import InterfaceRadixTree from './../Interface-Radix-Tree'

import InterfaceAccountRadixTreeNode from './Interface-Accountant-Radix-Tree-Node'
import InterfaceRadixTreeEdge from './../Interface-Radix-Tree-Edge'


/**
 * OBSOLETE
 */
class InterfaceAccountantRadixTree extends InterfaceRadixTree{

    _createNode(parent, edges, value){
        //console.log("amount", amount)
        return new InterfaceAccountRadixTreeNode(parent, edges, value);
    }

    _setNode(node, value){
        InterfaceRadixTree.prototype._setNode(this, node);
        node.setValue(value);
    }

    _changedNode(node){
        // recalculate the balances
        this.refreshAccount(node, true);

        InterfaceRadixTree.prototype._changedNode.call(this, node);
    }

    _checkInvalidNode(node){

        if (!InterfaceRadixTree.prototype._checkInvalidNode.call(this, node))
            return false;

        //it should have a valid value

        if (node.isSumValid() === false)
            return false;
        if (node.sum.isLessThan(0) )
            return false;

        if (node.isLeaf() && (node.isBalancesValid() === false ) )
            return false;
        if (node.isBalancesValid() && node.value.balances.isLessThan(0))
            return false;

        return true;
    }


    /**
     * Validate an Accountant (node)
     * @param node
     * @returns {boolean}
     */
    validateAccount(node){

        //validate bottom to up

        let initialSum = null;

        if (node.isSumValid() === false)
            return false;
        else
            initialSum = node.sum;

        this._computeAccount(node);

        if (node.isSumValid() === false)
            return false;
        if (initialSum.isEqualTo(node.sum) === false)
            return false; // different sum

        return true;
    }

    /**
     * Compute the Accountant based on his children
     * @param node
     */
    _computeAccount(node){

        if (node === null || node === undefined)
            throw {message: "Couldn't compute the Sum because Node is empty"};

        let sum;

        if ( node.isBalancesValid()  )
            sum = node.value.balances;
        else
            sum = new BigNumber(0);


        if ( node.edges.length > 0 ){

            for (let i = 0; i < node.edges.length; i++){

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

        if (node === null || node === undefined)
            throw {message: "Couldn't compute the Sum because Node is empty"};

        let result = false;

        if (forced === undefined || forced === false)
            result  = this.validateAccount(node); // in case it is not necessary to recalculate the hash by force

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

    /**
     * update the balance of a node and propagate it up
     * @param input
     * @param value
     */
    update( input, value ){

        //not done

    }

}

export default InterfaceAccountantRadixTree;