import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesList from 'node/lists/Nodes-List';
import NODE_TYPE from "node/lists/types/Node-Type";
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"
import PoolsUtils from "common/mining-pools/common/Pools-Utils"
import PoolProtocolList from "common/mining-pools/common/Pool-Protocol-List"
import StatusEvents from "common/events/Status-Events";

class PoolConnectedServersProtocol extends PoolProtocolList{

    constructor(poolManagement){

        super();

        this.poolManagement = poolManagement;

        this.connectedServersPools = [];
        this.list = this.connectedServersPools;

    }

    async insertServersListWaitlist(serversListArray){

        return await PoolsUtils.insertServersListWaitlist(serversListArray, NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_POOL );

    }

    async startPoolConnectedServersProtocol(){

        if (!this.poolManagement.poolSettings.poolUsePoolServers) return false;

        for (let i=0; i<NodesList.nodes.length; i++)
            await this._subscribePoolConnectedServer(NodesList.nodes[i].socket);

        NodesList.emitter.on("nodes-list/connected", async (nodesListObject) => {
            await this._subscribePoolConnectedServer(nodesListObject.socket)
        });

        NodesList.emitter.on("nodes-list/disconnected", (nodesListObject) => {
            this._unsubscribePoolConnectedServer(nodesListObject)
        });


    }

    async _subscribePoolConnectedServer(socket){

        if (! this.poolManagement._poolStarted) return;
        if (!this.poolManagement.poolSettings.poolUsePoolServers) return;

        try{

            if ( socket.node.protocol.nodeType === NODE_TYPE.NODE_TERMINAL && socket.node.protocol.nodeConsensusType === NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER ){

                let answer = await this._registerPoolToServerPool(socket);

                if (!answer)
                    throw {message: "poolConnected raised an error"};

            }

        } catch (exception){

            console.error("PoolConnectedServersProtocol raised an error", exception);
            socket.disconnect();

        }


    }

    _unsubscribePoolConnectedServer(nodesListObject) {

        let socket = nodesListObject.socket;

        if (socket.node.protocol.nodeConsensusType === NODE_CONSENSUS_TYPE.NODE_CONSENSUS_POOL)
            StatusEvents.emit("pools/servers-connections", {message: "Server Removed"});
    }




    async _registerPoolToServerPool(socket) {

        let answer = await socket.node.sendRequestWaitOnce("server-pool/register-pool", {
            poolName: this.poolManagement.poolSettings.poolName,
            poolFee: this.poolManagement.poolSettings.poolFee,
            poolWebsite: this.poolManagement.poolSettings.poolWebsite,
            poolPublicKey: this.poolManagement.poolSettings.poolPublicKey,
            poolServers: this.poolManagement.poolSettings.poolServers,
        }, "answer");

        try{

            if (answer === null || answer.result !== true) throw {message: "ServerPool returned false"};
            if (typeof answer.serverPoolFee !== "number" ) throw {message: "ServerPool returned a wrong fee"};
            if ( answer.serverPoolFee < 0 || answer.serverPoolFee > 1) throw {message: "ServerPool returned a wrong fee"};
            if ( !Buffer.isBuffer(answer.messageToSign) || answer.messageToSign.length !== 32) throw {message: "ServerPool message is wrong"};

            if (answer.serverPoolFee > 0.2){

                await socket.node.sendRequestWaitOnce("server-pool/register-pool/answer/confirmation", { result: false, message: "ServerPool fee is too high"}, "answer");

                setTimeout(()=>{
                    console.error("serverPoolFee is too big");
                    socket.disconnect();
                }, 5000);

                return;

            }

            let signature = this.poolManagement.poolSettings.poolDigitalSign(answer.messageToSign);

            let confirmation = await socket.node.sendRequestWaitOnce("server-pool/register-pool/answer/confirmation", { result: true, signature: signature}, "answer");

            if (confirmation === null) throw {message: "ServerPool returned a null confirmation"};

            if (confirmation.result === true){

                this._addConnectedServerPool(socket, answer.serverPoolFee);

                return true;

            } else {
                throw {message: "ServerPool returned a wrong confirmation"};
            }


        } catch (exception){

            console.error("Pool ConnectedServersProtocol returned an error", exception);
            socket.disconnect();

        }

        return false;


    }

    _addConnectedServerPool(socket, fee){

        socket.node.protocol.serverPool = {
            serverPoolFee: fee,
        };

        socket.node.protocol.nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_POOL;

        this.addElement(socket);

        StatusEvents.emit("pools/servers-connections", {message: "Server Removed"});

         this.poolManagement.poolProtocol.poolConnectedMinersProtocol._subscribePoolConnectedMiners(socket);

    }

}

export default PoolConnectedServersProtocol;