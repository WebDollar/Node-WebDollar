import PPoWBlockchainFork from "common/blockchain/ppow-blockchain/protocol/PPoW-Blockchain-Fork"
import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import consts from "consts/const_global";
import InterfaceBlockchainBlockValidation from "common/blockchain/interface-blockchain/blocks/validation/Interface-Blockchain-Block-Validation"

let inheritFork;
if (consts.POPOW_PARAMS.ACTIVATED) inheritFork = PPoWBlockchainFork;
else inheritFork = InterfaceBlockchainFork;

class MiniBlockchainFork extends inheritFork{


    constructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header){

        super(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header)

        this._accountantTreeClone = null;

    }

    /**
     * Fork Validation for Mini Blockchain is not checking the Accountant Tree
     */
    _createBlockValidation_ForkValidation(height, forkHeight){

        let validationType = {"skip-accountant-tree-validation": true};

        if (height === this.forkChainLength-1)
            validationType["validation-timestamp-adjusted-time"] = true;

        return new InterfaceBlockchainBlockValidation(this.getForkDifficultyTarget.bind(this), this.getForkTimeStamp.bind(this), this.getForkPrevHash.bind(this), validationType );
    }

    preFork(){

        //clone the Accountant Tree
        this._accountantTreeClone = this.blockchain.accountantTree.serializeMiniAccountant();

        console.log("preFork root before", this.blockchain.accountantTree.calculateNodeCoins());
        console.log("preFork positions", this.forkStartingHeight, this.blockchain.blocks.length-1);

        //remove transactions and rewards from each blocks
        for (let i = this.blockchain.blocks.length - 1; i >= this.forkStartingHeight; i--) {


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

        if (forkedSuccessfully)
            return true;

        //recover to the original Accountant Tree
        this.blockchain.accountantTree.deserializeMiniAccountant(this._accountantTreeClone);

    }

    postFork(forkedSuccessfully){

    }

}

export default MiniBlockchainFork