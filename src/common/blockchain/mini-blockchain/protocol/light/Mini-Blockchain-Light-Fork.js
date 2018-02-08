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

        if ( forkHeight === 0 && (this.forkChainStartingPoint === this.forkStartingHeight) ) {

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
            let diffIndex = this.forkStartingHeight;
            console.log("this.forkDiff", diffIndex);

            this._accountantTreeClone = this.blockchain.lightAccountantTreeSerializations[diffIndex];
            if (this._accountantTreeClone === undefined || this._accountantTreeClone === null) this._accountantTreeClone = new Buffer(0);

            console.log("preFork1 accountantTree sum all", this.blockchain.accountantTree.calculateNodeCoins() );

            this.blockchain.accountantTree.deserializeMiniAccountant( this.forkPrevAccountantTree );

            console.log("preFork hashAccountantTree", this.blockchain.accountantTree.root.hash.sha256.toString("hex"));
            console.log("preFork hashAccountantTree", this.forkPrevAccountantTree.toString("hex"));
            console.log("preFork2 accountantTree sum all", this.blockchain.accountantTree.calculateNodeCoins() );

            console.log("this.forkPrevDifficultyTarget", this.forkPrevDifficultyTarget.toString("hex"));
            console.log("this.forkPrevTimeStamp", this.forkPrevTimeStamp);
            console.log("this.forkPrevHashPrev", this.forkPrevHashPrev.toString("hex"));

            this._lightAccountantTreeSerializationsHeightClone = new Buffer(this.blockchain.lightAccountantTreeSerializations[diffIndex] !== undefined ? this.blockchain.lightAccountantTreeSerializations[diffIndex] : 0);
            this._blocksStartingPointClone = this.blockchain.blocksStartingPoint;
            this._lightPrevDifficultyTargetClone = new Buffer(this.blockchain.lightPrevDifficultyTargets[diffIndex] !== undefined ? this.blockchain.lightPrevDifficultyTargets[diffIndex] : 0);
            this._lightPrevTimeStampClone = this.blockchain.lightPrevTimeStamps[diffIndex];
            this._lightPrevHashPrevClone = new Buffer(this.blockchain.lightPrevHashPrevs[diffIndex] !== undefined ? this.blockchain.lightPrevHashPrevs[diffIndex] : 0);

            this.blockchain.blocksStartingPoint = this.forkChainStartingPoint;
            this.blockchain.lightPrevDifficultyTargets[diffIndex] = this.forkPrevDifficultyTarget;
            this.blockchain.lightPrevTimeStamps[diffIndex] = this.forkPrevTimeStamp;
            this.blockchain.lightPrevHashPrevs[diffIndex] = this.forkPrevHashPrev;

            this.blockchain.lightAccountantTreeSerializations[diffIndex] = this.forkPrevAccountantTree;

            //add dummy blocks between [beginning to where it starts]
            while (this.blockchain.blocks.length < this.forkStartingHeight)
                this.blockchain.addBlock(undefined);

        } else
            //it is just a simple fork
            return MiniBlockchainFork.prototype.preFork.call(this);
    }

    async postForkBefore(forkedSuccessfully){

        if (forkedSuccessfully)
            return true;

        //recover to the original Accountant Tree & state
        if (this.forkPrevAccountantTree !== null && Buffer.isBuffer(this.forkPrevAccountantTree)){

            //recover to the original Accountant Tree
            console.log("postForkBefore1 accountantTree sum all", this.blockchain.accountantTree.calculateNodeCoins() );
            this.blockchain.accountantTree.deserializeMiniAccountant(this._accountantTreeClone);
            console.log("postForkBefore2 accountantTree sum all", this.blockchain.accountantTree.calculateNodeCoins() );

            this.blockchain.blocksStartingPoint = this._blocksStartingPointClone;

            let diffIndex = this.forkStartingHeight ;

            this.blockchain.lightPrevDifficultyTargets[diffIndex] = this._lightPrevDifficultyTargetClone;
            this.blockchain.lightPrevTimeStamps[diffIndex] = this._lightPrevTimeStampClone;
            this.blockchain.lightPrevHashPrevs[diffIndex] = this._lightPrevHashPrevClone;
            this.blockchain.lightAccountantTreeSerializations[diffIndex] = this._lightAccountantTreeSerializationsHeightClone;

            //if (!await this.blockchain._recalculateLightPrevs( this.blockchain.blocks.length - consts.POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS - 1)) throw "_recalculateLightPrevs failed";
        } else
        return MiniBlockchainFork.prototype.postForkBefore.call(this, forkedSuccessfully);
    }

    async postFork(forkedSuccessfully){

        if (forkedSuccessfully) {

            //saving the Light Settings

            return true;
        }


        return MiniBlockchainFork.prototype.postFork.call(this, forkedSuccessfully);

    }

}

export default MiniBlockchainLightFork