import InterfaceMerkleAccountantRadixTree from 'common/trees/radix-tree/accountant-tree/merkle-tree/Interface-Merkle-Accountant-Radix-Tree'
import InterfaceMerkleRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import InterfaceRadixTree from 'common/trees/radix-tree/Interface-Radix-Tree'
import MiniBlockchainAccountantTreeNode from './Mini-Blockchain-Accountant-Tree-Node'
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'

class MiniBlockchainAccountantTree extends InterfaceMerkleRadixTree{

    constructor (){
        super();
    }

    createNode(parent, edges, value){
        return new MiniBlockchainAccountantTreeNode(parent, edges, value);
    }

    updateAccount(input, value, tokenId){

        input = WebDollarCryptoData.createWebDollarCryptoData(input)

        let searchResult = this.search(input);

        // nothing to update
        if ( searchResult.node === undefined || searchResult.node === null) return false;

        if (!searchResult.node.isLeaf()) throw ("couldn't delete because input is not a leaf node");

        let node = searchResult.node;

        node.value = value;
        this.changedNode( node );

    }



}

export default MiniBlockchainAccountantTree