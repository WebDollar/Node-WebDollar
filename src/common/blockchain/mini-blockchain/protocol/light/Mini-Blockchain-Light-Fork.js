import MiniBlockchainFork from "./../Mini-Blockchain-Fork"

class MiniBlockchainLightFork extends MiniBlockchainFork {

    constructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header) {

        super(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header)

        this.forkPrevAccountantTree = null;
        this.forkPrevDifficultyTarget = null;
        this.forkPrevTimestamp = null;

        this._lightPrevDifficultyTargetClone = null;
    }

    async validateForkBlock(block, height){

        if ( height === this.forkStartingHeight ){

            if (this.forkPrevDifficultyTarget === null || this.forkPrevDifficultyTarget === undefined)
                throw "forkPrevDifficultyTarget was not specified";

            return await this.blockchain.validateBlockchainBlock(block, this.forkPrevDifficultyTarget, null, null, { "skip-accountant-tree-validation": true, "skip-prev-hash-validation": true } );

        } else
            await MiniBlockchainFork.prototype.validateForkBlock.call(block,height);

    }

    _getForkPrevsData(height, forkHeight){

        // transition from blockchain to fork
        if (height === 0)

        // based on genesis block
            return {
                prevDifficultyTarget : undefined,
                prevHash : undefined,
                prevTimeStamp : undefined,
            };

        else if ( forkHeight === 0)

        // based on previous block from blockchain

            return {
                prevDifficultyTarget : this.forkPrevDifficultyTarget,
                prevHash : new Buffer(32),
                prevTimeStamp : this.forkPrevTimestamp,
            };

        else  // just the fork

            return {
                prevDifficultyTarget : this.forkBlocks[forkHeight - 1].difficultyTarget,
                prevHash : this.forkBlocks[forkHeight - 1].hash,
                prevTimeStamp : this.forkBlocks[forkHeight - 1].timeStamp,
            }

    }

    preFork() {

        //I have a new accountant Tree
        if (this.forkPrevAccountantTree !== null && Buffer.isBuffer(this.forkPrevAccountantTree)){

            this._accountantTreeRootClone = this.blockchain.accountantTree.cloneTree();

            this.blockchain.accountantTree.deserializeMiniAccountant( this.forkPrevAccountantTree );

            this._lightPrevDifficultyTargetClone = this.blockchain.lightPrevDifficultyTarget;
            this._blocksStartingPointClone = this.blockchain.blocksStartingPoint;

            this.blockchain.blocksStartingPoint = this.forkChainStartingPoint;
            this.blockchain.lightPrevDifficultyTarget = this.forkPrevDifficultyTarget;

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