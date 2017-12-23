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

        this.value = value;


    }

    updateBalanceWEB(value){

    }

    updateBalanceToken(value, token){
        
    }

}

export default MiniBlockchainAccountantTreeNode