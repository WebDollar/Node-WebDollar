import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'

class MiniBlockchainFork extends InterfaceBlockchainFork{

    preFork(){

        //clone the Accountant Tree
        this._accountantTreeRoot = this.blockchain.accountantTree.cloneTree();

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

        //rollback to the original Accountant Tree
        this.blockchain.accountantTree.root = this._accountantTreeRoot;

    }

}

export default MiniBlockchainFork