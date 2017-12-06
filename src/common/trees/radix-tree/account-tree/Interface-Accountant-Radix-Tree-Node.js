import InterfaceRadixTreeNode from './../Interface-Radix-Tree-Node'
var BigNumber = require('bignumber.js');

class InterfaceAccountRadixTreeNode extends InterfaceRadixTreeNode{

    // value must contain .amount

    constructor(parent, edges, value, amount){

        super (parent, edges, value);

        if (typeof amount === "object"  && amount !== null && amount.constructor.name === "BigNumber") this.amount =  amount;
        else {

            if (typeof amount === 'undefined' || amount === null) amount = 0;

            this.amount = new BigNumber(amount);
        }

    }

    isAmountValid(){

        if (typeof this.amount === 'undefined' && this.amount === null) return false;
        if (typeof this.amount !== "object"  || this.amount.constructor.name !== "BigNumber") return false;

        return true;

    }



}

export default InterfaceAccountRadixTreeNode;