import InterfaceMerkleAccountantRadixTree from 'common/trees/radix-tree/accountant-tree/merkle-tree/Interface-Merkle-Accountant-Radix-Tree'
import InterfaceMerkeRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import InterfaceRadixTreeNode from 'common/trees/radix-tree/Interface-Radix-Tree-Node'
import InterfaceMerkleTree from "common/trees/merkle-tree/Interface-Merkle-Tree";

class MiniBlockchainAccountantTreeNode extends InterfaceRadixTreeNode{

    constructor (parent, edges, value){

        super(parent, edges);

        value = value || {};
        value.balanceWEBD = value.balanceWEBD || 0;
        value.balanceTokens = value.balanceTokens || [];

        this.balanceWEBD = value.balanceWEBD;
        this.balanceTokens = value.balanceTokens;


    }

    updateBalanceToken(value, tokenId){

        let result;

        if (tokenId === undefined || tokenId=== null || tokenId === '') {
            tokenId = "webd";
        }

        if (tokenId === "webd"){
            this.balanceWEBD += value;
            result = {
                tokenId: tokenId,
                value: this.balanceWEBD
            };
        }
        else {
            for (let i = 0; i < this.balanceTokens.length; i++)
                if (this.balanceTokens[i].id === tokenId) {
                    this.balanceTokens[i].amount += value;
                    result = {
                        tokenId: tokenId,
                        value: this.balanceTokens[i].amount
                    };
                }
        }


        if (result === undefined)
            throw 'no token found';

        if (result < 0)
            throw 'balance became negative';

        this.deleteBalancesEmpty();

        if (this.balanceWEBD === 0 && this.balanceTokens.length === 0)
            return null; //to be deleted

        return result;

    }

    getBalance(tokenId){

        if (tokenId === undefined)
            return this.balanceWEBD;

        for (let i=0; i<this.balanceTokens.length; i++)
            if (this.balanceTokens[i].id === tokenId)
                return this.balanceTokens[i].amount || 0;

        return 0;

    }

    deleteBalancesEmpty(){

        let result = false;
        for (let i=this.balanceTokens.length-1; i>=0; i--)
            if (this.balanceTokens[i].amount === 0 || this.balanceTokens[i] === null) {
                this.balanceTokens.splice(i, 1);
                result = true;
            }

        return true;

    }

}

export default MiniBlockchainAccountantTreeNode