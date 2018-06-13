import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesList from 'node/lists/Nodes-List';
import NODE_TYPE from "node/lists/types/Node-Type";
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"

class PoolConnectedServersProtocol{

    constructor(poolManagement){

        this.poolManagement = poolManagement;

    }

    async insertServersListWaitlist(serversListArray){

        if (!Array.isArray(serversListArray) || serversListArray.length === 0) return false;

        NodesWaitlist.deleteWaitlistByConsensusNode(NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER);
        NodesList.disconnectAllNodesByConsensusType(NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER);

        NodesWaitlist.deleteWaitlistByConsensusNode(NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_POOL);
        NodesList.disconnectAllNodesByConsensusType(NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_POOL);

        for (let i=0; i<serversListArray.length; i++){

            let server = serversListArray[i];

            await NodesWaitlist.addNewNodeToWaitlist( server, undefined, NODE_TYPE.NODE_TERMINAL, NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER );

        }

    }

    startPoolConnectedServersProtocol(){

        NodesList.emitter.on("nodes-list/connected", (nodesListObject) => {
            this._subscribePoolConnectedServer(nodesListObject)
        });

    }

    async _subscribePoolConnectedServer(nodesListObject){

        let socket = nodesListObject.socket;

        if ( socket.node.protocol.nodeType === NODE_TYPE.NODE_TERMINAL && socket.node.protocol.nodeConsensusType === NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER ){

            await this._registerPoolToServerPool(socket);

        }

    }

    async _registerPoolToServerPool(socket) {

        let answer = await socket.sendRequestWaitOnce("server-pool/register-pool", {
            poolName: this.poolManagement.poolSettings.poolName,
            poolFee: this.poolManagement.poolSettings.poolFee,
            poolWebsite: this.poolManagement.poolSettings.poolWebsite,
            poolPublicKey: this.poolManagement.poolSettings.poolPublicKey,
        });

        //TODO make a confirmation using a digital signature

        if (answer !== null && answer.result === true && typeof answer.serverFee === "number" ) {

            socket.node.protocol.serverProol = {
                serverFee: answer.serverFee,
            };

            socket.node.protocol.nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_POOL;

        } else {
            socket.disconnect();
        }

    }

}

export default PoolConnectedServersProtocol;