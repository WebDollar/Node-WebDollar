import InterfaceBlockchainMining from "../Interface-Blockchain-Mining";
import consts from 'consts/const_global'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis';

class BlockchainBackboneMining extends InterfaceBlockchainMining {


    //backbone mining is the same with InterfaceBlockchainMining

    constructor(blockchain, minerAddress, miningFeePerByte){

        super(blockchain, minerAddress, miningFeePerByte);

        this.block = undefined;
        this.undefined = undefined;

        this.end = 0;

    }


    async mine(block, difficulty, start, end, height){

        this.block = block;
        this.difficulty = difficulty;
        this.end = Math.min(end, 0xFFFFFFFF);

        this.bestHash = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BUFFER;
        this.bestHashNonce = -1;

        return this._minePOS(block, difficulty);

    }

}

export default BlockchainBackboneMining;