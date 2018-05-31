import consts from "consts/const_global";
import NodesList from "node/lists/Nodes-List";
import Serialization from "common/utils/Serialization";
import PoolMiningWorker from "common/mining-pools/miner/miner-pool/Pool-Mining-Worker";

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

    }

    _subscribeMiner(nodesListObject){

        let socket = nodesListObject.socket;

        socket.node.on("mining-pool-protocol/create-miner-task", (data) => {

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
    

}

export default MinerProtocol;