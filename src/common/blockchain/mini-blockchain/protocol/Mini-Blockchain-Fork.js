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

        let validationType = {
            "skip-accountant-tree-validation": true,
            "skip-validation-transactions-from-values": true //can not validate the transactions
        };

        if (height === this.forkChainLength-1)
            validationType["validation-timestamp-adjusted-time"] = true;

        return new InterfaceBlockchainBlockValidation(this.getForkDifficultyTarget.bind(this), this.getForkTimeStamp.bind(this), this.getForkPrevHash.bind(this), validationType );
    }

    preForkClone(cloneBlocks=true){

        InterfaceBlockchainFork.prototype.preForkClone.call(this, cloneBlocks);

    }

    preFork(revertActions){

        //remove transactions and rewards from each blocks
        for (let i = this.blockchain.blocks.length - 1; i >= this.forkStartingHeight; i--) {

            let block = this.blockchain.blocks[i];

            // remove transactions
            for (let j=block.data.transactions.transactions.length-1; j>=0; j--)
                block.data.transactions.transactions[j].processTransaction( -1, revertActions );

            // remove reward
            this.blockchain.accountantTree.updateAccount( block.data.minerAddress, - block.reward, undefined, revertActions);


        }

    }


}

export default MiniBlockchainFork