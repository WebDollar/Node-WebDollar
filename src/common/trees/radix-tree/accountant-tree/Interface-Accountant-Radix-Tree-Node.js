import InterfaceRadixTreeNode from './../Interface-Radix-Tree-Node'
import Serialization from 'common/utils/Serialization'

class InterfaceAccountRadixTreeNode extends InterfaceRadixTreeNode{

    // value must contain .amount

    constructor(parent, edges, value, sum){

        super (parent, edges, value);

        this.setSum(sum);
        this.setValue(value);
    }

    setSum(sum){

        if (typeof sum === "object"  && sum !== null && typeof sum === 'number')
            this.sum =  sum;
        else {

            if (sum === undefined || sum === null)
                sum = 0;

            this.sum = sum;

        }

    }

    isSumValid(){

        if (this.sum === undefined && this.sum=== null)
            return false;
        if (typeof this.sum !== "object"  || typeof this.sum !== "number")
            return false;

        return true;

    }


    setValue(value){

        if (typeof value === 'object' && value !== null){

            if (typeof value.balances === "object"  && value.balances !== null && typeof value.balance === "number") {
            }
            else {

                if ( value.balances === undefined || value.balances === null)
                    value.balances = 0;

            }

        }

        this.value = value;

    }

    isBalancesValid(){

        if (typeof this.value !== 'object' || this.value === null)
            return false;

        if ( this.value.balances === undefined && this.value.balances === null)
            return false;

        if (typeof this.value.balances !== "object"  || this.value.balances !== "number")
            return false;

        return true;

    }

    // it is not done
    serializeNode(){

        let array = [ ];

        array.push( Serialization.serializeNumber8Bytes(this.sum) );

        if (this.value !== null )
            array.push(Serialization.serializeNumber8Bytes(this.value.balances));

        return Buffer.concat(

            array,

        );
    }

    deserializeNode(buffer){
        // TO DO
    }


}

export default InterfaceAccountRadixTreeNode;