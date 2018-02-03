import MiniBlockchainFork from "./../Mini-Blockchain-Fork"

class MiniBlockchainLightFork extends MiniBlockchainFork {

    constructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header) {

        super(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header)

        this.forkPrevAccountantTree = null;
        this.forkPrevDifficultyTarget = null;
        this.forkPrevTimeStamp = null;
        this.forkPrevHashPrev = null;

        this._blocksStartingPointClone = null;
        this._lightPrevDifficultyTargetClone = null;
        this._lightPrevTimeStampClone = null;
        this._lightPrevHashPrevClone = null;
        this._lightAccountantTreeSerializationsHeightClone = null;
    }

    async validateForkBlock(block, height, blockValidationType){
        return await MiniBlockchainFork.prototype.validateForkBlock.call(this, block, height, blockValidationType||{});
    }

    _getForkPrevsData(height, forkHeight){

        // transition from blockchain to fork
        if (height === 0)
            // based on genesis block
            return {
                prevDifficultyTarget : undefined,
                prevHash : undefined,
                prevTimeStamp : undefined,
                blockValidationType: {},
            };

        else if ( forkHeight === 0 && this.forkChainStartingPoint === this.forkStartingHeight ) {

            // based on previous block from blockchain
            if (this.forkPrevDifficultyTarget === null || this.forkPrevDifficultyTarget === undefined) throw "forkPrevDifficultyTarget was not specified";
            if (this.forkPrevHashPrev === null || this.forkPrevHashPrev === undefined) throw "forkPrevHashPrev was not specified";
            if (this.forkPrevTimeStamp === null || this.forkPrevTimeStamp === undefined) throw "forkPrevTimeStamp was not specified";

            return {
                prevDifficultyTarget: this.forkPrevDifficultyTarget,
                prevHash: this.forkPrevHashPrev,
                prevTimeStamp: this.forkPrevTimeStamp,
                blockValidationType: {},
            };
        }
        else  // just the fork

            return {
                prevDifficultyTarget : this.forkBlocks[forkHeight - 1].difficultyTarget,
                prevHash : this.forkBlocks[forkHeight - 1].hash,
                prevTimeStamp : this.forkBlocks[forkHeight - 1].timeStamp,
                blockValidationType: {},
            }

    }

    preFork() {

        //I have a new accountant Tree
        if (this.forkPrevAccountantTree !== null && Buffer.isBuffer(this.forkPrevAccountantTree)){

            console.log("preFork!!!!!!!!!!!!!!!!!! 2222222");
            this._accountantTreeRootClone = this.blockchain.accountantTree.cloneTree();

            this.blockchain.accountantTree.deserializeMiniAccountant( this.forkPrevAccountantTree );

            console.log("preFork hashAccountantTree", this.forkPrevAccountantTree.toString("hex"));
            console.log("preFork hashAccountantTree", this.blockchain.accountantTree.root);
            if (this.blockchain.accountantTree.root.edges.length > 0)
                console.log("preFork hashAccountantTree", this.blockchain.accountantTree.root.edges[0].targetNode.balances[0].amount);
            console.log("this.forkPrevDifficultyTarget", this.forkPrevDifficultyTarget);
            console.log("this.forkPrevTimeStamp", this.forkPrevTimeStamp);
            console.log("this.forkPrevHashPrev", this.forkPrevHashPrev);

            this._lightAccountantTreeSerializationsHeightClone = this.blockchain.lightAccountantTreeSerializations[this.forkStartingHeight-1] ;
            this._blocksStartingPointClone = this.blockchain.blocksStartingPoint;
            this._lightPrevDifficultyTargetClone = this.blockchain.lightPrevDifficultyTarget;
            this._lightPrevTimeStampClone = this.blockchain.lightPrevTimeStamp;
            this._lightPrevHashPrevClone = this.blockchain.lightPrevHashPrev;

            this.blockchain.blocksStartingPoint = this.forkChainStartingPoint;
            this.blockchain.lightPrevDifficultyTarget = this.forkPrevDifficultyTarget;
            this.blockchain.lightPrevTimeStamp = this.forkPrevTimeStamp;
            this.blockchain.lightPrevHashPrev = this.forkPrevHashPrev;

            this.blockchain._addTreeSerialization(this.forkStartingHeight-1, this.forkPrevAccountantTree, this.forkChainLength);

            //add dummy blocks between [beginning to where it starts]
            while (this.blockchain.blocks.length < this.forkStartingHeight){
                this.blockchain.addBlock(undefined);
            }

        } else
            //it is just a simple fork
            return MiniBlockchainFork.prototype.preFork.call(this);
    }

    postFork(forkedSuccessfully){

        if (forkedSuccessfully) return true;

        //recover to the original Accountant Tree & state

        this.blockchain.blocksStartingPoint = this._blocksStartingPointClone;
        this.blockchain.lightPrevDifficultyTarget = this._lightPrevDifficultyTargetClone;
        this.blockchain.lightPrevTimeStamp = this._lightPrevTimeStampClone;
        this.blockchain.lightPrevHashPrev = this._lightPrevHashPrevClone;
        this.blockchain.lightAccountantTreeSerializations[this.forkStartingHeight-1] = this._lightAccountantTreeSerializationsHeightClone;

        return MiniBlockchainFork.prototype.postFork.call(this, forkedSuccessfully);
    }

}

export default MiniBlockchainLightFork