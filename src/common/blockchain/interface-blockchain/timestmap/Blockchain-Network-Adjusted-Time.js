import NodesList from 'node/lists/nodes-list'
import consts from 'consts/const_global'
import NetworkAdjustedTimeClusters from "./clusters/Network-Adjusted-Time-Clusters";
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

class BlockchainNetworkAdjustedTime {

    constructor(blockchainTimestamp){

        this.blockchainTimestamp = blockchainTimestamp;
        this.networkAdjustedTimeClusters = new NetworkAdjustedTimeClusters();

        NodesList.emitter.on("nodes-list/connected", async (result) => { await this.initializingNewNode(result); } );

        NodesList.emitter.on("nodes-list/disconnected", async (result) => { await this._removeNodeTimeAdjusted(result); });
    }

    get networkAdjustedTime(){

        if (this.networkAdjustedTimeClusters.clusterBest !== null )
            return ( this.networkAdjustedTimeClusters.clusterBest.meanTimeUTCOffset +  this.blockchainTimestamp.timeUTC );
        else
            return this.blockchainTimestamp.timeUTC;

    }


    async initializingNewNode(nodesListObject){

        let socket = nodesListObject.socket;

        try {

            let answer = await socket.node.sendRequestWaitOnce( "timestamp/request-timeUTC", {}, 'answer' );

            if (typeof answer !== "number")
                return "The node didn't answer to my request-timeUTC";

            //avoiding double couting the same timestamp from the same node
            this._addNodeTimeAdjusted(socket, answer);


        } catch (exception){
            console.error("Error includeNodeNetworkAdjustedTime to the node", exception, nodesListObject);
        }

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