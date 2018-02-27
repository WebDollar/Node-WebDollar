import NodesList from 'node/lists/nodes-list'
import consts from 'consts/const_global'
import NetworkAdjustedTimeClusters from "./clusters/Network-Adjusted-Time-Clusters";
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

class BlockchainNetworkAdjustedTime {

    constructor(blockchainTimestamp){

        this.blockchainTimestamp = blockchainTimestamp;
        this.networkAdjustedTimeClusters = new NetworkAdjustedTimeClusters();

        NodesList.emitter.on("nodes-list/connected", async (result) => { await this._initializingNewNode(result); } );

        NodesList.emitter.on("nodes-list/disconnected", async (result) => { await this._desinitializeNode(result); });
    }

    get networkAdjustedTime(){

        if (this.networkAdjustedTimeClusters.clusterBest !== null )
            return ( this.networkAdjustedTimeClusters.clusterBest.meanTimeUTCOffset +  this.blockchainTimestamp.timeUTC );
        else
            return this.blockchainTimestamp.timeUTC;

    }


    async _initializingNewNode(nodesListObject){

        let socket = nodesListObject.socket;

        try {

            let answer = await socket.node.sendRequestWaitOnce( "timestamp/request-timeUTC", {}, 'answer' );

            if (answer === null || answer === undefined) throw "The node answer for timestamp returned null or empty";

            if (answer.result === false) throw "The node answer for timestamp is false";

            if (typeof answer.timeUTC !== "number") throw "The node didn't answer to my request-timeUTC";

            //avoiding double counting the same timestamp from the same node
            this._addNodeTimeAdjusted(socket, answer.timeUTC);


        } catch (exception){
            console.error("Error includeNodeNetworkAdjustedTime to the node", exception, nodesListObject.socket.node.sckAddress.toString());
        }

    }

    _desinitializeNode(nodesListObject) {

        let socket = nodesListObject.socket;

        this._removeNodeTimeAdjusted(socket);
    }

    _addNodeTimeAdjusted(socket, socketTimeUTC ){

        if ( socketTimeUTC  <= BlockchainGenesis.timeStampOffset ) {
            console.error("Socket timestamp is illegal");
            return false;
        }

        this.networkAdjustedTimeClusters.addNAT( socket, socketTimeUTC - this.blockchainTimestamp.timeUTC );
    }

    _removeNodeTimeAdjusted(socket){
        this.networkAdjustedTimeClusters.deleteNAT(socket);
    }

}

export default BlockchainNetworkAdjustedTime;