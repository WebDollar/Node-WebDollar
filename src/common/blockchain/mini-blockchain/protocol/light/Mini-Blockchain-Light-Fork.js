import consts from 'consts/const_global'
import MiniBlockchainFork from "./../Mini-Blockchain-Fork"
import InterfaceBlockchainBlockValidation from "common/blockchain/interface-blockchain/blocks/validation/Interface-Blockchain-Block-Validation"

class MiniBlockchainLightFork extends MiniBlockchainFork {

    constructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header) {

        super(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header)

        this.forkPrevAccountantTree = null;
        this.forkPrevDifficultyTarget = null;
        this.forkPrevTimeStamp = null;
        this.forkPrevHashPrev = null;

        this.forkDifficultyCalculation = {
            difficultyAdditionalBlocks: [],
            difficultyCalculationStarts: 0,
        };

        this._blocksStartingPointClone = null;
        this._lightPrevDifficultyTargetClone = null;
        this._lightPrevTimeStampClone = null;
        this._lightPrevHashPrevClone = null;
        this._lightAccountantTreeSerializationsHeightClone = null;
    }

    // return the difficultly target for ForkBlock
    getForkDifficultyTarget(height){

        let forkHeight = height - this.forkStartingHeight;

        if (this.forkChainStartingPoint === this.forkStartingHeight && height !== 0 && height === this.forkStartingHeight){
            if (this.forkPrevDifficultyTarget === null || this.forkPrevDifficultyTarget === undefined) throw {message: "forkPrevDifficultyTarget was not specified"};
            return this.forkPrevDifficultyTarget;
        }

        return MiniBlockchainFork.prototype.getForkDifficultyTarget.call(this, height);

    }

    getForkTimeStamp(height){

        let forkHeight = height - this.forkStartingHeight;

        if (this.forkChainStartingPoint === this.forkStartingHeight && height !== 0 && height === this.forkStartingHeight){
            if (this.forkPrevTimeStamp === null || this.forkPrevTimeStamp === undefined)
                throw {message: "forkPrevTimeStamp was not specified"};
            return this.forkPrevTimeStamp;
        }

        return MiniBlockchainFork.prototype.getForkTimeStamp.call(this, height);

    }

    getForkPrevHash(height){

        let forkHeight = height - this.forkStartingHeight;

        if (this.forkChainStartingPoint === this.forkStartingHeight && height !== 0 && height === this.forkStartingHeight){
            if (this.forkPrevHashPrev === null || this.forkPrevHashPrev === undefined)
                throw {message: "forkPrevHashPrev was not specified"};
            return this.forkPrevHashPrev;
        }

        return MiniBlockchainFork.prototype.getForkPrevHash.call(this, height);
    }

    _createBlockValidation_ForkValidation(height, forkHeight){

        let validationType = {
            "skip-accountant-tree-validation": true,
            "skip-validation-transactions-from-values": true,
        };

        if ( height < this.forkDifficultyCalculation.difficultyCalculationStarts)
            validationType["skip-difficulty-recalculation"] = true;

        if (height === this.forkChainLength-1)
            validationType["validation-timestamp-adjusted-time"] = true;

        //it's a new light fork && i have less than forkHeight
        if (this.forkChainStartingPoint === this.forkStartingHeight && forkHeight < consts.BLOCKCHAIN.TIMESTAMP.VALIDATION_NO_BLOCKS )
            validationType["skip-validation-timestamp"] = true;

        return new InterfaceBlockchainBlockValidation(this.getForkDifficultyTarget.bind(this), this.getForkTimeStamp.bind(this), this.getForkPrevHash.bind(this), validationType );
    }

    _createBlockValidation_BlockchainValidation(height, forkHeight){
        let validationType = {};

        if ( height < this.forkDifficultyCalculation.difficultyCalculationStarts)
            validationType["skip-difficulty-recalculation"] = true;

        if (height === this.forkChainLength-1)
            validationType["validation-timestamp-adjusted-time"] = true;

        //it's a new light fork && i have less than forkHeight
        if (this.forkChainStartingPoint === this.forkStartingHeight && forkHeight < consts.BLOCKCHAIN.TIMESTAMP.VALIDATION_NO_BLOCKS )
            validationType["skip-validation-timestamp"] = true;

        return new InterfaceBlockchainBlockValidation(this.getForkDifficultyTarget.bind(this), this.getForkTimeStamp.bind(this), this.getForkPrevHash.bind(this), validationType );
    }

    preForkClone(){

        if (this.forkChainStartingPoint === this.forkStartingHeight &&
            this.forkPrevAccountantTree !== null && Buffer.isBuffer(this.forkPrevAccountantTree)){

            let diffIndex = this.forkDifficultyCalculation.difficultyAdditionalBlocks[0];

            this._accountantTreeClone = this.blockchain.lightAccountantTreeSerializations[diffIndex];

            if (this._accountantTreeClone === undefined || this._accountantTreeClone === null)
                this._accountantTreeClone = new Buffer(0);

            this._lightAccountantTreeSerializationsHeightClone = new Buffer(this.blockchain.lightAccountantTreeSerializations[diffIndex] !== undefined ? this.blockchain.lightAccountantTreeSerializations[diffIndex] : 0);
            this._blocksStartingPointClone = this.blockchain.blocks.blocksStartingPoint;
            this._lightPrevDifficultyTargetClone = new Buffer(this.blockchain.lightPrevDifficultyTargets[diffIndex] !== undefined ? this.blockchain.lightPrevDifficultyTargets[diffIndex] : 0);
            this._lightPrevTimeStampClone = this.blockchain.lightPrevTimeStamps[diffIndex];
            this._lightPrevHashPrevClone = new Buffer(this.blockchain.lightPrevHashPrevs[diffIndex] !== undefined ? this.blockchain.lightPrevHashPrevs[diffIndex] : 0);

            //it is just a simple fork
            return MiniBlockchainFork.prototype.preForkClone.call(this, true, false);

        } else
        //it is just a simple fork
            return MiniBlockchainFork.prototype.preForkClone.call(this, true, true);

    }

    preFork() {

        // I have a new accountant Tree, so it is a new [:-m] light proof

        if (this.forkChainStartingPoint === this.forkStartingHeight &&
            this.forkPrevAccountantTree !== null && Buffer.isBuffer(this.forkPrevAccountantTree)){

            let diffIndex = this.forkDifficultyCalculation.difficultyAdditionalBlocks[0];

            let currentSum = this.blockchain.accountantTree.calculateNodeCoins();

            //validate sum
            this.blockchain.accountantTree.deserializeMiniAccountant( this.forkPrevAccountantTree );

            let sum = this.blockchain.accountantTree.calculateNodeCoins();

            if (sum < currentSum || sum <= 0){
                throw {message: "Accountant Tree sum is smaller than previous accountant Tree!!! Impossible", forkSum: currentSum, blockchainSum: sum};
            }

            this.blockchain.blocks.blocksStartingPoint = this.forkChainStartingPoint;
            this.blockchain.lightPrevDifficultyTargets[diffIndex] = this.forkPrevDifficultyTarget;
            this.blockchain.lightPrevTimeStamps[diffIndex] = this.forkPrevTimeStamp;
            this.blockchain.lightPrevHashPrevs[diffIndex] = this.forkPrevHashPrev;

            this.blockchain.lightAccountantTreeSerializations[diffIndex] = this.forkPrevAccountantTree;

        } else
            //it is just a simple fork
            return MiniBlockchainFork.prototype.preFork.call(this);
    }

    revertFork(){

        //recover to the original Accountant Tree & state
        if (this.forkPrevAccountantTree !== null && Buffer.isBuffer(this.forkPrevAccountantTree)){

            //recover to the original Accountant Tree
            //console.log("revertFork1 accountantTree sum all", this.blockchain.accountantTree.calculateNodeCoins() );
            this.blockchain.accountantTree.deserializeMiniAccountant(this._accountantTreeClone);
            //console.log("revertFork2 accountantTree sum all", this.blockchain.accountantTree.calculateNodeCoins() );

            this.blockchain.blocks.blocksStartingPoint = this._blocksStartingPointClone;

            let diffIndex = this.forkStartingHeight;

            this.blockchain.lightPrevDifficultyTargets[diffIndex] = this._lightPrevDifficultyTargetClone;
            this.blockchain.lightPrevTimeStamps[diffIndex] = this._lightPrevTimeStampClone;
            this.blockchain.lightPrevHashPrevs[diffIndex] = this._lightPrevHashPrevClone;
            this.blockchain.lightAccountantTreeSerializations[diffIndex] = this._lightAccountantTreeSerializationsHeightClone;

            //if (! (await this.blockchain._recalculateLightPrevs( this.blockchain.blocks.length - consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS - 1))) throw {message: "_recalculateLightPrevs failed"};
        } else
            return MiniBlockchainFork.prototype.revertFork.call(this);
    }

    async postFork(forkedSuccessfully){

        return MiniBlockchainFork.prototype.postFork.call(this, forkedSuccessfully);

    }

    async saveIncludeBlock(index, revertActions){

        let answer = await MiniBlockchainFork.prototype.saveIncludeBlock.call(this, index, revertActions);

        if (answer){

            if (this.forkChainStartingPoint === this.forkStartingHeight && index === 0)
                this.forkBlocks[index].difficultyTarget = this.forkDifficultyCalculation.difficultyAdditionalBlockFirstDifficulty
        }

        return answer;
    }


}

export default MiniBlockchainLightFork