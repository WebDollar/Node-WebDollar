import BlockchainDifficulty from "common/blockchain/global/difficulty/Blockchain-Difficulty"

class InterfaceBlockchainBlockValidation {

    constructor(getBlockCallBack, getDifficultyCallback, getTimeStampCallback, getHashPrevCallback, blockValidationType){

        if (blockValidationType === undefined || blockValidationType === null)
            blockValidationType = {};

        this.getBlockCallBack = getBlockCallBack;
        this.getDifficultyCallback = getDifficultyCallback;
        this.getTimeStampCallback = getTimeStampCallback;
        this.getHashPrevCallback = getHashPrevCallback;

        this.blockValidationType = blockValidationType;
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