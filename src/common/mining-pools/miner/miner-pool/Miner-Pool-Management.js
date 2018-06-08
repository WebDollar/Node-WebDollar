import consts from "consts/const_global";
import NodesList from "node/lists/Nodes-List";
import Serialization from "common/utils/Serialization";
import PoolMining from "common/mining-pools/miner/miner-pool/mining/Pool-Mining";
import MinerPoolProtocol from "common/mining-pools/miner/miner-pool/protocol/Miner-Pool-Protocol"
import MinerPoolSettings from "common/mining-pools/miner/miner-pool/Miner-Pool-Settings"

class MinerProtocol {

    constructor (){

        //this stores the last sent hash

        this.minerPoolSettings = new MinerPoolSettings(this);
        this.minerPoolProtocol = new MinerPoolProtocol(this);

        this._miningData = {
            blockData: undefined,
            difficultyTarget: undefined
        };
        
        this._poolMining = new PoolMining();

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
        
        this._poolMining.mine(blockData, difficultyTarget);
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