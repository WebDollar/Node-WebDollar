import InterfaceRadixTreeNode from './../Interface-Radix-Tree-Node'
import Serialization from 'common/utils/Serialization'
var BigNumber = require('bignumber.js');

class InterfaceAccountRadixTreeNode extends InterfaceRadixTreeNode{

    // value must contain .amount

    constructor(parent, edges, value, sum){

        super (parent, edges, value);

        this.setSum(sum);
        this.setValue(value);
    }

    setSum(sum){

        if (typeof sum === "object"  && sum !== null && sum.constructor.name === "BigNumber") this.sum =  sum;
        else {

            if ( sum === undefined || sum === null) sum = 0;

            this.sum = new BigNumber(sum);
        }

    }

    isSumValid(){

        if ( this.sum === undefined && this.sum=== null) return false;
        if (typeof this.sum !== "object"  || this.sum.constructor.name !== "BigNumber") return false;

        return true;

    }


    setValue(value){

        if (typeof value === 'object' && value !== null){

            if (typeof value.balances === "object"  && value.balances !== null && value.balance.constructor.name === "BigNumber") { }
            else {

                if ( value.balances === undefined || value.balances === null) value.balances = 0;

                value.balances = new BigNumber(value.balances);
            }

        }

        this.value = value;

    }

    isBalancesValid(){

        if (typeof this.value !== 'object' || this.value === null) return false;

        if ( this.value.balances === undefined && this.value.balances=== null) return false;
        if (typeof this.value.balances !== "object"  || this.value.balances.constructor.name !== "BigNumber") return false;

        return true;

    }

    serialize(){

        let array = [ ];

        array.push( Serialization.serializeBigNumber(this.sum) );

        if (this.value !== null )
            array.push(Serialization.serializeBigNumber(this.value.balances));

        return Buffer.concat(

            array,

        );
    }

    deserialize(buffer){



    }


}

export default InterfaceAccountRadixTreeNode;