import NodesList from 'node/lists/Nodes-List';
import NODE_TYPE from "node/lists/types/Node-Type";
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"

class PoolConnectedServersProtocol{

    constructor(poolManagement){

        this.poolManagement = poolManagement;

    }

    startPoolConnectedServersProtocol(){

        NodesList.emitter.on("nodes-list/connected", (nodesListObject) => {
            this._subscribePoolConnectedServer(nodesListObject)
        });

    }

    async _subscribePoolConnectedServer(nodesListObject){

        let socket = nodesListObject.socket;

        if (socket.node.protocol.nodeType === NODE_TYPE.NODE_TERMINAL && socket.node.protocol.nodeConsensusType === NODE_CONSENSUS_TYPE.NODE_SERVER_CONSENSUS ){

            await this.registerPoolToServerPool(socket);

        }

    }

    async registerPoolToServerPool(socket) {

        let answer = await socket.sendRequestWaitOnce("server-pool/register-pool", {
            poolName: this.poolManagement.poolSettings.poolName,
            poolFee: this.poolManagement.poolSettings.poolFee,
            poolWebsite: this.poolManagement.poolSettings.poolWebsite,
            poolPublicKey: this.poolManagement.poolSettings.poolPublicKey,
        });

        //TODO make a confirmation using a digital signature

        if (answer !== null && answer.result === true && typeof answer.serverFee === "number" ) {

            this._extendSocketForServerPool(socket, answer.serverFee);

        }

    }

    _extendSocketForServerPool(socket, serverFee){

        socket.node.protocol.serverProol = {
            serverFee: serverFee,
        };

    }


}

export default PoolConnectedServersProtocol;