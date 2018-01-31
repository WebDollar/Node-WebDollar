import PPoWBlockchainFork from "common/blockchain/ppow-blockchain/protocol/PPoW-Blockchain-Fork"
import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import consts from "consts/const_global";

let inheritFork;
if (consts.POPOW_ACTIVATED) inheritFork = PPoWBlockchainFork;
else inheritFork = InterfaceBlockchainFork;

class MiniBlockchainFork extends inheritFork{


    constructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header){

        super(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header)

        this._accountantTreeRootClone = null;

    }

    preFork(){

        //clone the Accountant Tree
        this._accountantTreeRootClone = this.blockchain.accountantTree.cloneTree();

        //console.log("root.targetNode.balances before", this.blockchain.accountantTree.root.edges[0].targetNode.balances);

        //remove transactions and rewards from each blocks
        for (let i = this.blockchain.getBlockchainLength()-1; i>=this.forkStartingHeight; i--) {

            //remove reward

            console.log(this.blockchain.blocks[i].reward.toString(),"+");
            this.blockchain.accountantTree.updateAccount(this.blockchain.blocks[i].data.minerAddress, this.blockchain.blocks[i].reward.negated() );

            //remove transactions
            // !!!!!!!!!!!!
            //this.blockchain.blocks[i] =
        }

        // console.log("this.forkStartingHeight", this.forkStartingHeight);
        // console.log("root", this.blockchain.accountantTree.root);
        // console.log("root.edges", this.blockchain.accountantTree.root.edges[0]);
        // console.log("root.targetNode.balances", this.blockchain.accountantTree.root.edges[0].targetNode.balances);

    }

    postFork(forkedSuccessfully){

        if (forkedSuccessfully) return true;

        //recover to the original Accountant Tree
        this.blockchain.accountantTree.root = this._accountantTreeRootClone;

    }

}

export default MiniBlockchainFork