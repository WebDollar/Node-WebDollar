import NodesList from 'node/lists/nodes-list'
import consts from 'consts/const_global'
import NetworkAdjustedTimeClusters from "./clusters/Network-Adjusted-Time-Clusters";
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

class BlockchainNetworkAdjustedTime {

    constructor(blockchainTimestamp){

        this.blockchainTimestamp = blockchainTimestamp;
        this.resetNetworkAdjustedTime();

        NodesList.emitter.on("nodes-list/connected", async (result) => { await this.initializingNewNode(result); } );

        NodesList.emitter.on("nodes-list/disconnected", async (result) => { await this._removeNodeTimeAdjusted(result); });
    }

    get networkAdjustedTime(){
        return (this._networkAdjustedTimeOffset + this.blockchainTimestamp.timeUTC) / (this._networkAdjustedTimeNodesUsed + 1);
    }

    resetNetworkAdjustedTime(){

        this._networkAdjustedTimeOffset = 0;
        this._networkAdjustedTimeNodes = [];
        this._networkAdjustedTimeNodesUsed = 0;

    }

    async initializingNewNode(nodesListObject){

        let socket = nodesListObject.socket;

        try {
            let answer = await socket.node.sendRequestWaitOnce("timestamp/request-timeUTC", {}, 'answer' );

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

        //one IP, one vote
        let foundNodeIndex = this._findNodeTimeAdjusted(socket);
        if (foundNodeIndex === -1){

            this._insertNodeTimeAdjusted(socket, socketTimeUTC - this.blockchainTimestamp.timeUTC);

            foundNodeIndex = this._networkAdjustedTimeNodes.length - 1;

        } else { // I already found one, let's refresh

            this._networkAdjustedTimeOffset -= (this._networkAdjustedTimeNodes[foundNodeIndex].socketTimeUTCOffset);

            this._networkAdjustedTimeNodes[foundNodeIndex].socketTimeUTCOffset = (socketTimeUTC - this.blockchainTimestamp.timeUTC);

        }

        this._networkAdjustedTimeOffset +=  this._networkAdjustedTimeNodes[foundNodeIndex].socketTimeUTCOffset;

    }

    _removeNodeTimeAdjusted(socket){

        let foundNodeIndex = this._findNodeTimeAdjusted(socket);
        if (foundNodeIndex === -1)
            return false;

        this._networkAdjustedTimeOffset -= (this._networkAdjustedTimeNodes[foundNodeIndex].socketTimeUTCOffset);

        this._deleteNodeTimeAdjusted(socket);
    }

    determiningNodeTimeAdjustedMajoriy(socket){

    }

    /**
     * Operations with Array
     */

    _findNodeTimeAdjusted(socket){

        for (let i = 0; i < this._networkAdjustedTimeNodes.length; i++)
            if (socket.node.sckAddress.matchAddress(this._networkAdjustedTimeNodes[i].socket.node.sckAddress)){
                return i;
            }

        return -1;

    }

    _insertNodeTimeAdjusted(socket, socketTimeUTCOffset){
        this._networkAdjustedTimeNodes.push ( {
            socket: socket,
            socketTimeUTCOffset: socketTimeUTCOffset
        });

        this._networkAdjustedTimeNodesUsed++;
    }

    _deleteNodeTimeAdjusted(socket){

        let nodeFoundIndex = this._findNodeTimeAdjusted(socket);

        if (nodeFoundIndex === -1)
            return false;

        this._networkAdjustedTimeNodes.splice(nodeFoundIndex, 1);
        this._networkAdjustedTimeNodesUsed--;

    }

}

export default BlockchainNetworkAdjustedTime;