import NodesList from 'node/lists/nodes-list';

class MinerProtocol {

    constructor(){

        NodesList.emitter.on("nodes-list/connected", (result) => { this._subscribeMiner(result) } );
        NodesList.emitter.on("nodes-list/disconnected", (result ) => { this._unsubscribeMiner(result ) });
        
        this.hashList = [];

    }

    _subscribeMiner(nodesListObject){

        let socket = nodesListObject.socket;

        socket.node.on("mining-pool-protocol/create-minner-task", (data) => {

            try{

                this.sendTaskResponse(socket);

            } catch (exception) {

                console.log("Minner didn't send task response");

            }

        });

    }

    _unsubscribeMiner(nodesListObject){

        let socket = nodesListObject.socket;

    }
    
    getMiningData() {
        //TODO: get data from PoolLeader and deserialize
    }

    sendTaskResponse(socket){

        socket.node.sendRequest("mining-pool-protocol/get-minner-work", (data) => {

            try{

                //TODO: Serialize mining-data and send to PoolLeader
                let taskResponse = this.getTaskResult(socket);
                

            } catch (exception) {

                console.log("Minner didn't send task response");

            }

        });

    }
    
    getTaskResult() {
        return this._serializeHashList();
    }
    
    _serializeHashList(){
        
    }

    createMiningHashes(){

        //TODO: create a list with best X hashes
        

    }

}

export default new MinerProtocol();