import InterfaceRadixTreeNode from './../Interface-Radix-Tree-Node'
var BigDecimal = require('decimal.js');

class InterfaceAccountRadixTreeNode extends InterfaceRadixTreeNode{

    // value must contain .amount

    constructor(parent, edges, value, sum){

        super (parent, edges, value);

        this.setSum(sum);
        this.setValue(value);
    }

    setSum(sum){

        if (typeof sum === "object"  && sum !== null && sum.constructor.name === "Decimal") this.sum =  sum;
        else {

            if ( sum === undefined || sum === null) sum = 0;

            this.sum = new BigDecimal(sum);
        }

    }

    isSumValid(){

        if ( this.sum === undefined && this.sum=== null) return false;
        if (typeof this.sum !== "object"  || this.sum.constructor.name !== "Decimal") return false;

        return true;

    }


    setValue(value){

        if (typeof value === 'object' && value !== null){

            if (typeof value.balance === "object"  && value.balance !== null && value.balance.constructor.name === "Decimal") { }
            else {

                if ( value.balance === undefined || value.balance === null) value.balance = 0;

                value.balance = new BigDecimal(value.balance);
            }

        }

        this.value = value;

    }

    isBalanceValid(){

        if (typeof this.value !== 'object' || this.value === null) return false;

        if ( this.value.balance === undefined && this.value.balance=== null) return false;
        if (typeof this.value.balance !== "object"  || this.value.balance.constructor.name !== "Decimal") return false;

        return true;

    }


}

export default InterfaceAccountRadixTreeNode;