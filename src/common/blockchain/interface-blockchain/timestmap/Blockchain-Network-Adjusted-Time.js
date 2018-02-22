import NodesList from 'node/lists/nodes-list'

class BlockchainNetworkAdjustedTime{

    constructor(blockchainTimestamp){

        this.blockchainTimestamp = blockchainTimestamp;
        this.resetNetworkAdjustedTime();

        NodesList.emitter.on("nodes-list/connected", async (result) => { await this.initializingNewNode(result) } );

        NodesList.emitter.on("nodes-list/disconnected", (result) => {

        });

    }

    get networkAdjustedTime(){
        return this._networkAdjustedTime;
    }

    resetNetworkAdjustedTime(){
        this._networkAdjustedTimeOffset = 0;
        this._networkAdjustedTimeNodes = [];
    }

    async initializingNewNode(nodesListObject){

        let socket = nodesListObject.socket;

        try {
            let answer = await socket.node.sendRequestWaitOnce("timestamp/request-timeUTC", {}, );

            if (typeof answer !== "number") return "The node didn't answer to my request-timeUTC";

            //avoiding double couting the same timestamp from the same node
            this._addNodeTimeAdjusted(socket, answer);


        } catch (exception){
            console.error("Error includeNodeNetworkAdjustedTime to the node", exception, nodesListObject);
        }

    }


    _addNodeTimeAdjusted(socket, timeUTC ){

        //one IP, one vote
        if (this._findNodeTimeAdjusted(socket) === -1){

            this._networkAdjustedTimeOffset +=  (timeUTC - this.blockchainTimestamp.timeUTC);

        } else { // I already found one, let's refresh

            this._networkAdjustedTimeOffset +=  (timeUTC - this.blockchainTimestamp.timeUTC);

        }

    }

    _findNodeTimeAdjusted(socket){

        for (let i=0; i<this._networkAdjustedTimeNodes.length; i++)
            if (socket.node.sckAddress.matchAddress(this._networkAdjustedTimeNodes[i].socket.node.sckAddress){
                return i;
            }

        return -1;

    }

}

export default BlockchainNetworkAdjustedTime;