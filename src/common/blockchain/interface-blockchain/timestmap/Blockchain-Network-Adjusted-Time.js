import NodesList from 'node/lists/Nodes-List'
import consts from 'consts/const_global'
import NetworkAdjustedTimeClusters from "./clusters/Network-Adjusted-Time-Clusters";
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import BlockchainTimestamp from "./Blockchain-Timestamp";

class BlockchainNetworkAdjustedTime {

    constructor(blockchainTimestamp){

        this.blockchainTimestamp = blockchainTimestamp;
        this.networkAdjustedTimeClusters = new NetworkAdjustedTimeClusters();

        NodesList.emitter.on("nodes-list/connected", async (nodesListObject) => {

            this._initializingNewNodeTimestmap(nodesListObject.socket, nodesListObject.socket.node.protocol.nodeUTC);

        });

        NodesList.emitter.on("nodes-list/disconnected", async (nodesListObject) => {
            await this._desinitializeNode(nodesListObject);
        });
    }

    get networkAdjustedTime(){

        if (this.networkAdjustedTimeClusters.clusterBest !== null )
            return ( this.networkAdjustedTimeClusters.clusterBest.meanTimeUTCOffset +  this.blockchainTimestamp.timeUTC );
        else
            return this.blockchainTimestamp.timeUTC;

    }


    async _initializingNewNodeTimestmap( socket, timestamp ){

        this.blockchainTimestamp._initializeNewSocket();

        try {

            if (timestamp === null || timestamp === undefined) throw {message: "The node answer for timestamp returned null or empty"};

            if (typeof timestamp === "string") timestamp = parseInt(timestamp);
            if (typeof timestamp !== "number") throw {message: "The node didn't answer to my request-timeUTC"};

            //avoiding double counting the same timestamp from the same node
            this._addNodeTimeAdjusted(socket, timestamp);


        } catch (exception){
            console.error("Error includeNodeNetworkAdjustedTime to the node", exception, socket.node.sckAddress.toString());
        }

    }

    _desinitializeNode(nodesListObject) {

        this._removeNodeTimeAdjusted(nodesListObject.socket);

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