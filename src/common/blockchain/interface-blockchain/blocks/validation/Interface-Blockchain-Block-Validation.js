import BlockchainDifficulty from "common/blockchain/global/difficulty/Blockchain-Difficulty"

class InterfaceBlockchainBlockValidation {

    constructor(getBlockCallBack, getDifficultyCallback, getTimeStampCallback, getHashPrevCallback, getChainHashCallback, blockValidationType){

        if (blockValidationType === undefined || blockValidationType === null)
            blockValidationType = {};

        this.getBlockCallBack = getBlockCallBack;
        this.getDifficultyCallback = getDifficultyCallback;
        this.getTimeStampCallback = getTimeStampCallback;
        this.getHashPrevCallback = getHashPrevCallback;
        this.getChainHashCallback = getChainHashCallback;

        this.blockValidationType = blockValidationType;
    }

    destroyBlockValidation(){

        this.getBlockCallBack = undefined;
        this.getDifficultyCallback = undefined;
        this.getTimeStampCallback = undefined;
        this.getHashPrevCallback = undefined;
        this.getChainHashCallback = undefined;

        this.blockValidationType = undefined;

    }

    getDifficulty(blockTimestamp, blockNumber){

        return BlockchainDifficulty.getDifficulty(this.getDifficultyCallback, this.getTimeStampCallback, blockTimestamp, blockNumber)

    }


    saveValidation(){

    }

    loadValidation(){

    }

}

export default InterfaceBlockchainBlockValidation;