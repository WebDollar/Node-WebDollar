import InterfaceRadixTreeNode from './../Interface-Radix-Tree-Node'
import Serialization from 'common/utils/Serialization'
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"

class InterfaceAccountRadixTreeNode extends InterfaceRadixTreeNode{

    // value must contain .amount

    constructor(parent, edges, value, sum){

        super (parent, edges, value);

        this.setSum(sum);
        this.setValue(value);
    }

    setSum(sum){

        if (sum === undefined || sum === null)
            sum = 0;

        if (typeof sum === "string")
            sum = parseInt(sum);

        this.sum = Integer(sum);

    }

    isSumValid(){
        return WebDollarCoins.validateCoinsNumber(this.sum);
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

    isBalancesValid(){

        if (typeof this.value !== 'object' || this.value === null)
            return false;

        if (!WebDollarCoins.validateCoinsNumber(this.value.balances))
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