import MiniBlockchainFork from "./../Mini-Blockchain-Fork"

class MiniBlockchainLightFork extends MiniBlockchainFork {

    constructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header) {

        super(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header)

        this.newForkAccountantTree = null;
        this.newForkDifficultyTarget = null;

        this._lightPrevDifficultyTargetClone = null;
    }

    async validateForkBlock(block, height){

        if ( height === this.forkStartingHeight ){

            if (this.newForkDifficultyTarget === null || this.newForkDifficultyTarget === undefined)
                throw "newForkDifficultyTarget was not specified";

            return await this.blockchain.validateBlockchainBlock(block, this.newForkDifficultyTarget, null, null, { "skip-accountant-tree-validation": true, "skip-prev-hash-validation": true } );

        } else
            await MiniBlockchainFork.prototype.validateForkBlock.call(block,height);

    }

    preFork() {

        //I have a new accountant Tree
        if (this.newForkAccountantTree !== null && Buffer.isBuffer(this.newForkAccountantTree)){

            this._accountantTreeRootClone = this.blockchain.accountantTree.cloneTree();
            this._lightPrevDifficultyTargetClone = this.blockchain.lightPrevDifficultyTarget;
            this._blocksStartingPointClone = this.blockchain.blocksStartingPoint;

            this.blockchain.accountantTree.deserializeMiniAccountant( this.newForkAccountantTree );
            this.blockchain.blocksStartingPoint = this.forkChainStartingPoint;
            this.blockchain.lightPrevDifficultyTarget = this.newForkDifficultyTarget;

        } else
            //it is just a simple fork
            return MiniBlockchainFork.prototype.preFork.call(this);
    }

    postFork(forkedSuccessfully){

        if (forkedSuccessfully) return true;

        //recover to the original Accountant Tree & state

        this.blockchain.lightPrevDifficultyTarget = this._lightPrevDifficultyTargetClone;
        this.blockchain.blocksStartingPoint = this._blocksStartingPointClone;
        this.blockchain.lightPrevDifficultyTarget = this._lightPrevDifficultyTargetClone;

        return MiniBlockchainFork.prototype.postFork.call(this, forkedSuccessfully);
    }

}

export default MiniBlockchainLightFork