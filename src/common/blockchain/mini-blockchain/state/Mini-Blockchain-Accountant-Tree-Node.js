import InterfaceMerkleAccountantRadixTree from 'common/trees/radix-tree/accountant-tree/merkle-tree/Interface-Merkle-Accountant-Radix-Tree'
import InterfaceMerkeRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import InterfaceRadixTreeNode from 'common/trees/radix-tree/Interface-Radix-Tree-Node'
import InterfaceMerkleTree from "common/trees/merkle-tree/Interface-Merkle-Tree";
import WebDollarCryptoData from "common/crypto/WebDollar-Crypto-Data";
import Serialization from "common/utils/Serialization";

var BigNumber = require('bignumber.js');

class MiniBlockchainAccountantTreeNode extends InterfaceRadixTreeNode{

    constructor (parent, edges, value){

        super(parent, edges);

        if (value !== undefined) {
            value = value || {};

            value.balances = value.balances||[];

            this.balances = value.balances;
            this.value = value;
        }


    }

    updateBalanceToken(value, tokenId){

        if (tokenId === undefined  || tokenId === '' || tokenId === null) tokenId = 'webd';

        tokenId = WebDollarCryptoData.createWebDollarCryptoData(tokenId).buffer;

        if (!value instanceof BigNumber)
            value = new BigNumber(value);

        let result;

        for (let i = 0; i < this.balances.length; i++)
            if (this.balances[i].id.equals( tokenId )) {
                this.balances[i].amount = this.balances[i].amount.plus(value) ;
                result = this.balances[i];
                break;
            }


        if (result === undefined && tokenId !== null){

            this.balances.push ({
                id: tokenId,
                amount: value,
            });
            result = this.balances[this.balances.length-1];
        }

        if (result === undefined) throw 'token is empty';

        if (result.amount < 0)
            throw 'balance became negative';

        this.deleteBalancesEmpty();

        if (this.balances.length === 0)
            return null; //to be deleted

        return {
            tokenId: result.id,
            amount: result.amount,
        };

    }

    getBalance(tokenId){

        if (tokenId === undefined  || tokenId === '' || tokenId === null) tokenId = 'webd';

        tokenId = WebDollarCryptoData.createWebDollarCryptoData(tokenId).buffer;

        for (let i=0; i<this.balances.length; i++)
            if (this.balances[i].id.equals( tokenId) )
                return this.balances[i].amount;

        return 0;

    }

    getBalances(){

        if (!this.isLeaf())
            return null;

        let list = { };

        for (let i=0; i<this.balances.length; i++)
            list[ this.balances[i].id.toString() ] = this.balances[i].amount;


        return list;
    }

    deleteBalancesEmpty(){

        let result = false;
        for (let i=this.value.balances.length-1; i>=0; i--)
            if (this.value.balances[i].amount.equals(0) || this.value.balances[i] === null) {
                this.value.balances.splice(i, 1);
                result = true;
            }

        return true;

    }


    serialize(){

        let buffer;

        buffer = Buffer.concat ( [
                                   Serialization.serializeNumber1Byte(this.value.balances.length),
                                 ]);

        return Buffer;

    }

    deserialize(){

    }

}

export default MiniBlockchainAccountantTreeNode