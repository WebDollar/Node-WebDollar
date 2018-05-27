import consts from "consts/const_global";
import NodesList from "node/lists/Nodes-List";
import Serialization from "common/utils/Serialization";
import PoolMiningWorker from "common/mining-pools/miner/Pool-Mining-Worker";

class MinerProtocol {

    /**
     *
     * @param poolData should contain connectivity information
     */
    constructor(miningFeeThreshold, poolData){

        NodesList.emitter.on("nodes-list/connected", (result) => { 
            this._subscribeMiner(result);
        });
        NodesList.emitter.on("nodes-list/disconnected", (result ) => {
            this._unsubscribeMiner(result);
        });
        
        //this stores the last sent hash
        this._activeHash = consts.MINING_POOL.BASE_HASH_STRING;

        this._miningData = {blockData: undefined, difficultyTarget: undefined};
        
        this._miningWorker = new PoolMiningWorker(miningFeeThreshold);
    }

    _subscribeMiner(nodesListObject){

        let socket = nodesListObject.socket;

        socket.node.on("mining-pool-protocol/create-minner-task", (data) => {

            try{

                this.sendTaskResponse(socket);

            } catch (exception) {

                console.log("Miner didn't send task response");

            }

        });

    }

    _unsubscribeMiner(nodesListObject){

        let socket = nodesListObject.socket;

    }
    
    getMiningData() {
        //TODO: get data from PoolLeader and deserialize
        //mining data should be like {blockData: , difficultyTarget: }
        //blockData should be like this:  {height: , difficultyTargetPrev: , computedBlockPrefix: , nonce: }
        return this._miningData;
    }

    sendTaskResponse(socket){

        socket.node.sendRequest("mining-pool-protocol/get-minner-work", (data) => {

            try{

                //TODO: Serialize mining-data and send to PoolLeader
                let taskResponse = this.getTaskResult(socket);

            } catch (exception) {

                console.log("Miner didn't send task response");

            }

        });

    }
    
    /*
    getTaskResult() {
        return this._serializeHashList();
    }
    
    _serializeHashList(hashList){

        let list = [Serialization.serializeNumber2Bytes(hashList.length)];

        for (let i = 0; i < hashList.length; ++i) {

            list.push( Serialization.serializeNumber1Byte(BufferExtended.fromBase(hashList[i].address).length) );
            list.push( BufferExtended.fromBase(hashList[i].address) );

            list.push ( Serialization.serializeNumber7Bytes(hashList[i].reward) );
        }

        return Buffer.concat(list);

    }*/

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