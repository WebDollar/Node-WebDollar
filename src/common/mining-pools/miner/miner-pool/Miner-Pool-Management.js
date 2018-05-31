import consts from "consts/const_global";
import NodesList from "node/lists/Nodes-List";
import Serialization from "common/utils/Serialization";
import PoolMiningWorker from "common/mining-pools/miner/miner-pool/Pool-Mining-Worker";
import MinerPoolProtocol from "common/mining-pools/miner/miner-pool/protocol/M"
import MinerPoolSettings from "common/mining-pools/miner/miner-pool/Miner-Pool-Settings"

class MinerProtocol {

    /**
     *
     * @param poolData should contain connectivity information
     */
    constructor (miningFeeThreshold){

        //this stores the last sent hash
        this._activeHash = consts.MINING_POOL.BASE_HASH_STRING;
        this.minerPoolSettings = new MinerPoolSettings();

        this._miningData = {
            blockData: undefined,
            difficultyTarget: undefined
        };
        
        this._miningWorker = new PoolMiningWorker(miningFeeThreshold);

    }

    async initializeMinerPoolManagement(){
        await this.minerPoolSettings.initializeMinerPoolSettings();
    }

    getMiningData() {

        //TODO: get data from PoolLeader and deserialize
        //mining data should be like {blockData: , difficultyTarget: }
        //blockData should be like this:  {height: , difficultyTargetPrev: , computedBlockPrefix: , nonce: }
        return this._miningData;

    }

    async _mine(blockData, difficultyTarget) {
        
        this._miningWorker.mine(blockData, difficultyTarget);
    }

    async createMiningHashes(){

        //TODO: create a list with best X hashes
        let answer;
        try {
            answer = await this._mine(this._miningData.blockData, this._miningData.difficultyTarget);
        } catch (exception){
            console.error("Couldn't mine block ", this._miningData.blockData, exception);
            answer.result = false;
        }

        return answer;

    }
    
    async run() {
        
        await this._mine(this._miningData.blockData, this._miningData.difficultyTarget);
        
    }

}

export default MinerProtocol;