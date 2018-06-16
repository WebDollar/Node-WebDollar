import consts from "consts/const_global";
import NodesList from "node/lists/Nodes-List";
import Serialization from "common/utils/Serialization";
import PoolMining from "common/mining-pools/miner/mining/Pool-Mining";
import MinerPoolProtocol from "common/mining-pools/miner/protocol/Miner-Pool-Protocol"
import MinerPoolSettings from "common/mining-pools/miner/Miner-Pool-Settings"
import StatusEvents from "common/events/Status-Events";

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

        this._minerPoolInitialized = false;
        this._minerPoolOpened = false;
        this._minerPoolStarted = false;

    }

    async initializeMinerPoolManagement(poolURL){

        let answer = await this.minerPoolSettings.initializeMinerPoolSettings(poolURL);

        if (this.minerPoolSettings.poolURL !== '' && this.minerPoolSettings.poolURL !== undefined)
            this.minerPoolOpened = true;

        return answer;
    }

    async startMinerPool(poolURL){

        if (poolURL !== undefined)
            this.minerPoolSettings.setPoolURL(poolURL);

        if (this.minerPoolSettings.poolURL !== undefined && this.minerPoolSettings.poolURL !== '')
            return await this.minerPoolProtocol.startMinerProtocol(this.minerPoolSettings.poolURL);
        else {
            console.error("Couldn't start MinerPool");
            return false;
        }

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


    get minerPoolOpened(){
        return this._minerPoolOpened;
    }

    get minerPoolInitialized(){
        return this._minerPoolInitialized;
    }

    get minerPoolStarted(){
        return this._minerPoolStarted;
    }

    set minerPoolInitialized(value){
        this._minerPoolInitialized = value;
        StatusEvents.emit("miner-pool/status", {result: value, message: "Miner Pool Initialized changed" });
    }

    set minerPoolOpened(value){
        this._minerPoolOpened = value;
        StatusEvents.emit("miner-pool/status", {result: value, message: "Miner Pool Opened changed" });
    }

    set minerPoolStarted(value){
        this._minerPoolStarted = value;
        StatusEvents.emit("miner-pool/status", {result: value, message: "Miner Pool Started changed" });
    }


}

export default MinerProtocol;