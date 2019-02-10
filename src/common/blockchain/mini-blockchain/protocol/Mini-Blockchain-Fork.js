import PPoWBlockchainFork from "common/blockchain/ppow-blockchain/blockchain/forks/PPoW-Blockchain-Fork"
import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import consts from "consts/const_global";
import InterfaceBlockchainBlockValidation from "common/blockchain/interface-blockchain/blocks/validation/Interface-Blockchain-Block-Validation"

let inheritFork;
if (consts.POPOW_PARAMS.ACTIVATED) inheritFork = PPoWBlockchainFork;
else inheritFork = InterfaceBlockchainFork;

class MiniBlockchainFork extends inheritFork{


    constructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, forkChainLength, header){

        super(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, forkChainLength, header)

    }

    /**
     * Fork Validation for Mini Blockchain is not checking the Accountant Tree
     */
    _createBlockValidation_ForkValidation(height, forkHeight){

        let validationType = {
            "skip-accountant-tree-validation": true,
            "skip-validation-transactions-from-values": true //can not validate the transactions
        };

        return new InterfaceBlockchainBlockValidation(this.getForkBlock.bind(this), this.getForkDifficultyTarget.bind(this), this.getForkTimeStamp.bind(this), this.getForkPrevHash.bind(this), this.getForkChainHash.bind(this), validationType );
    }

    preForkClone(cloneBlocks=true, cloneAccountantTree=true){

        InterfaceBlockchainFork.prototype.preForkClone.call(this, cloneBlocks);



    }

    async preFork(revertActions, showUpdate=true){

        //remove transactions and rewards from each blocks
        for (let i = this.blockchain.blocks.length - 1; i >= this.forkStartingHeight; i--) {

            let block = await this.blockchain.getBlock( i );

            // remove transactions
            for (let j=block.data.transactions.transactions.length-1; j>=0; j--)
                block.data.transactions.transactions[j].processTransaction( -1, block.data.minerAddress, revertActions, showUpdate );

            // remove reward
            this.blockchain.accountantTree.updateAccount( block.data.minerAddress, - block.reward, undefined, revertActions, showUpdate);

        }

        return inheritFork.prototype.preFork.call(this, revertActions);

    }

    revertFork(){

        return inheritFork.prototype.revertFork.call(this);

    }


}

export default MiniBlockchainFork