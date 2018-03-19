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

                console.log("Miner didn't send task response");

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

                console.log("Miner didn't send task response");

            }

        });

    }
    
    getTaskResult() {
        return this._serializeHashList();
    }
    
    _serializeHashList(hashList){

        let list = [Serialization.serializeNumber2Bytes(hashList.length)];

        for (let i = 0; i < hashList.length; ++i) {

            list.push( Serialization.serializeNumber1Byte(BufferExtended.fromBase(hashList[i].address).length) );
            list.push( BufferExtended.fromBase(hashList[i].address) );

            list.push ( Serialization.serializeBigNumber(hashList[i].reward) );
        }

        return Buffer.concat(list);

    }

    async _mine() {

    }

    async createMiningHashes(){

        //TODO: create a list with best X hashes
        let answer;
        try {
            answer = await this.mine(block, difficulty);
        } catch (exception){
            console.error("Couldn't mine block ", block.height, exception);
            answer.result = false;
        }

    }

}

export default new MinerProtocol();