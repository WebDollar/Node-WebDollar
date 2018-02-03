import NodesList from 'node/lists/nodes-list';

class MinerProtocol{

    constructor(){

        NodesList.emitter.on("nodes-list/connected", (result) => { this._subscribeMiner(result) } );
        NodesList.emitter.on("nodes-list/disconnected", (result ) => { this._unsubscribeMiner(result ) });

    }

    _subscribeMiner(nodesListObject){

        let socket = nodesListObject.socket;

        socket.node.on("mining-pool-protocol/create-minner-task", (data)=>{

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

    sendTaskResponse(socket){

        socket.node.sendRequest("mining-pool-protocol/get-minner-work", (data)=>{

            try{

                this.createMiningHashes(socket);

            } catch (exception) {

                console.log("Minner didn't send task response");

            }

        });

    }

    createMiningHashes(){

        //To do mining

    }

}

export default new MinerProtocol();