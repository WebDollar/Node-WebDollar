import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'

class MiniBlockchainFork extends InterfaceBlockchainFork{

    preFork(){

        //clone the Accountant Tree
        this._accountantTreeRoot = this.blockchain.accountantTree.cloneTree();


        //remove transactions and rewards from each blocks
        for (let i = this.blockchain.getBlockchainLength()-1; i>=this.forkStartingHeight; i--) {
            //remove reward
            this.blockchain.accountantTree.updateAccount(this.blockchain.blocks[i].data.minerAddress, this.blockchain.blocks[i].reward.negated() );

            //remove transactions
            //this.blockchain.blocks[i] =
        }

        // console.log("this.blockchain.accountantTree.printLevelSearch");
        // this.blockchain.accountantTree.printLevelSearch();

    }

    postFork(forkedSuccessfully){

        if (forkedSuccessfully) return true;

        //rollback to the original Accountant Tree
        this.blockchain.accountantTree.root = this._accountantTreeRoot;

    }

}

export default MiniBlockchainFork