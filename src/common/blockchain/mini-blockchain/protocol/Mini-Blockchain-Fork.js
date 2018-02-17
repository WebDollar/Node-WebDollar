import PPoWBlockchainFork from "common/blockchain/ppow-blockchain/protocol/PPoW-Blockchain-Fork"
import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import consts from "consts/const_global";

let inheritFork;
if (consts.POPOW_PARAMS.ACTIVATED) inheritFork = PPoWBlockchainFork;
else inheritFork = InterfaceBlockchainFork;

class MiniBlockchainFork extends inheritFork{


    constructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header){

        super(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header)

        this._accountantTreeClone = null;

    }

    async validateForkBlock(block, height, blockValidationType){
        return await inheritFork.prototype.validateForkBlock.call(this, block, height, blockValidationType || {"skip-accountant-tree-validation": true} );
    }

    preFork(){

        //clone the Accountant Tree
        this._accountantTreeClone = this.blockchain.accountantTree.serializeMiniAccountant();

        console.log("preFork root before", this.blockchain.accountantTree.calculateNodeCoins());
        console.log("preFork positions", this.forkStartingHeight, this.blockchain.blocks.length-1);

        //remove transactions and rewards from each blocks
        for (let i = this.blockchain.blocks.length-1; i>=this.forkStartingHeight; i--) {


            //remove reward

            console.log("preFork block ", this.blockchain.blocks[i].reward.toString(),"+");
            this.blockchain.accountantTree.updateAccount(this.blockchain.blocks[i].data.minerAddress, this.blockchain.blocks[i].reward.negated() );

            //remove transactions
            // !!!!!!!!!!!!
            //this.blockchain.blocks[i] =
        }

        // console.log("this.forkStartingHeight", this.forkStartingHeight);
        // console.log("root", this.blockchain.accountantTree.root);
        // console.log("root.edges", this.blockchain.accountantTree.root.edges[0]);
        console.log("preFork root after ", this.blockchain.accountantTree.calculateNodeCoins());

    }

    postForkBefore(forkedSuccessfully){

        if (forkedSuccessfully) return true;

        //recover to the original Accountant Tree
        this.blockchain.accountantTree.deserializeMiniAccountant(this._accountantTreeClone);

    }

    postFork(forkedSuccessfully){

    }

}

export default MiniBlockchainFork