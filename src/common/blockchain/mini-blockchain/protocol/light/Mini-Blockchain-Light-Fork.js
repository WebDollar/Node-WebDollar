import consts from 'consts/const_global'
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

    _getForkPrevsData(height, forkHeight){

        if ( forkHeight === 0 && this.forkChainStartingPoint === this.forkStartingHeight ) {

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

        // transition from blockchain to fork
        return MiniBlockchainFork.prototype._getForkPrevsData.call(this, height, forkHeight);

    }

    preFork() {

        //I have a new accountant Tree
        if (this.forkPrevAccountantTree !== null && Buffer.isBuffer(this.forkPrevAccountantTree)){

            console.log("preFork!!!!!!!!!!!!!!!!!! 2222222");
            this._accountantTreeRootClone = this.blockchain.accountantTree.cloneTree();

            this.blockchain.accountantTree.deserializeMiniAccountant( this.forkPrevAccountantTree );

            console.log("preFork hashAccountantTree", this.forkPrevAccountantTree.toString("hex"));

            if (this.blockchain.accountantTree.root.edges.length > 0)
                console.log("preFork hashAccountantTree", this.blockchain.accountantTree.root.edges[0].targetNode.balances[0].amount);

            console.log("this.forkPrevDifficultyTarget", this.forkPrevDifficultyTarget.toString("hex"));
            console.log("this.forkPrevTimeStamp", this.forkPrevTimeStamp);
            console.log("this.forkPrevHashPrev", this.forkPrevHashPrev.toString("hex"));

            let diffIndex = this.forkStartingHeight;

            this._lightAccountantTreeSerializationsHeightClone = this.blockchain.lightAccountantTreeSerializations[diffIndex] ;
            this._blocksStartingPointClone = this.blockchain.blocksStartingPoint;
            this._lightPrevDifficultyTargetClone = this.blockchain.lightPrevDifficultyTargets[diffIndex];
            this._lightPrevTimeStampClone = this.blockchain.lightPrevTimeStamps[diffIndex];
            this._lightPrevHashPrevClone = this.blockchain.lightPrevHashPrevs[diffIndex];

            this.blockchain.blocksStartingPoint = this.forkChainStartingPoint;
            this.blockchain.lightPrevDifficultyTargets[diffIndex] = this.forkPrevDifficultyTarget;
            this.blockchain.lightPrevTimeStamps[diffIndex] = this.forkPrevTimeStamp;
            this.blockchain.lightPrevHashPrevs[diffIndex] = this.forkPrevHashPrev;

            //add dummy blocks between [beginning to where it starts]
            while (this.blockchain.blocks.length < this.forkStartingHeight)
                this.blockchain.addBlock(undefined);

        } else
            //it is just a simple fork
            return MiniBlockchainFork.prototype.preFork.call(this);
    }

    async postFork(forkedSuccessfully){

        if (forkedSuccessfully) {
            //if (!await this.blockchain._recalculateLightPrevs( this.blockchain.blocks.length - consts.POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS - 1)) throw "_recalculateLightPrevs failed";
            return;
        }

        //recover to the original Accountant Tree & state
        if (this.forkPrevAccountantTree !== null && Buffer.isBuffer(this.forkPrevAccountantTree)){

            this.blockchain.blocksStartingPoint = this._blocksStartingPointClone;

            let diffIndex = this.forkStartingHeight;

            this.blockchain.lightPrevDifficultyTargets[diffIndex] = this._lightPrevDifficultyTargetClone;
            this.blockchain.lightPrevTimeStamps[diffIndex] = this._lightPrevTimeStampClone;
            this.blockchain.lightPrevHashPrevs[diffIndex] = this._lightPrevHashPrevClone;
            this.blockchain.lightAccountantTreeSerializations[diffIndex] = this._lightAccountantTreeSerializationsHeightClone;

            //if (!await this.blockchain._recalculateLightPrevs( this.blockchain.blocks.length - consts.POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS - 1)) throw "_recalculateLightPrevs failed";
        }

        return MiniBlockchainFork.prototype.postFork.call(this, forkedSuccessfully);
    }

}

export default MiniBlockchainLightFork