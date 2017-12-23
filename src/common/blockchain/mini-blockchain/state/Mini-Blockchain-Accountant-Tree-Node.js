import InterfaceMerkleAccountantRadixTree from 'common/trees/radix-tree/accountant-tree/merkle-tree/Interface-Merkle-Accountant-Radix-Tree'
import InterfaceMerkeRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import InterfaceRadixTreeNode from 'common/trees/radix-tree/Interface-Radix-Tree-Node'
import InterfaceMerkleTree from "common/trees/merkle-tree/Interface-Merkle-Tree";
import WebDollarCryptoData from "../../../crypto/WebDollar-Crypto-Data";

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

        let result;

        for (let i = 0; i < this.balances.length; i++)
            if (this.balances[i].id === tokenId) {
                this.balances[i].amount += value;
                result = {
                    tokenId: this.balances[i].id.toString("hex"),
                    amount: this.balances[i].amount
                };
            }


        if (result === undefined && tokenId !== null){

            this.balances.push ({
                id: tokenId,
                amount: value,
            });

            result = {
                tokenId: this.balances[this.balances.length-1].id.toString("hex"),
                amount: this.balances[this.balances.length-1].amount
            };

        }

        if (result === undefined) throw 'token is empty';

        if (result.amount < 0)
            throw 'balance became negative';

        this.deleteBalancesEmpty();

        if (this.balances.length === 0)
            return null; //to be deleted

        return result;

    }

    getBalance(tokenId){

        if (tokenId === undefined  || tokenId === '' || tokenId === null) tokenId = 'webd';

        tokenId = WebDollarCryptoData.createWebDollarCryptoData(tokenId).buffer;

        for (let i=0; i<this.balances.length; i++)
            if (this.balances[i].id === tokenId)
                return this.balances[i].amount || 0;

        return 0;

    }

    getBalances(){

        if (!this.isLeaf())
            return null;

        let list = { };

        for (let i=0; i<this.balances.length; i++)
            list[ this.balances[i].id.toString("hex") ] = this.balances[i].amount;


    }

    deleteBalancesEmpty(){

        let result = false;
        for (let i=this.value.balances.length-1; i>=0; i--)
            if (this.value.balances[i].amount === 0 || this.value.balances[i] === null) {
                this.value.balances.splice(i, 1);
                result = true;
            }

        return true;

    }

}

export default MiniBlockchainAccountantTreeNode