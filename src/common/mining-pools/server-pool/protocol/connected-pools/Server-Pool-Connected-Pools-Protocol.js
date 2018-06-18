import ed25519 from "common/crypto/ed25519";
import NodesList from 'node/lists/Nodes-List';
import WebDollarCrypto from "../../../../crypto/WebDollar-Crypto";
import PoolProtocolList from "common/mining-pools/common/Pool-Protocol-List"
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"

class ServerPoolConnectedPoolsProtocol extends PoolProtocolList{


    constructor(serverPoolManagement){

        super();

        this.serverPoolManagement = serverPoolManagement;
        this.loaded = false;

        this.connectedPools = [];
        this.list = this.connectedPools;
    }

    startServerPoolConnectedPoolsProtocol(){

        if (this.loaded) return;

        for (let i=0; i<NodesList.nodes.length; i++)
            this._subscribeSocket(NodesList.nodes[i]);


        NodesList.emitter.on("nodes-list/connected", (result) => {
            this._subscribeSocket(result)
        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeSocket(result)
        });



        this.loaded = true;
    }

    _subscribeSocket(nodesListObject) {

        let socket = nodesListObject.socket;

        if (!this.serverPoolManagement.serverPoolStarted) return; //meanwhile it was suspended

        socket.node.on("server-pool/register-pool", async (data) => {

            if (!this.serverPoolManagement.serverPoolStarted) return; //meanwhile it was suspended

            try {

                if ( typeof data.poolName !== "string" || data.poolName.length <  5) throw {message: "ConnectedPool: poolName is not correct"};
                if ( typeof data.poolFee !== "number" || data.poolFee < 0 || data.poolFee > 100) throw { message: "ConnectedPool: poolFee is not correct" };
                if ( typeof data.poolWebsite !== "string" || data.poolWebsite.length <  5) throw { message: "ConnectedPool: poolWebsite is not correct" };

                if (!Buffer.isBuffer(data.poolPublicKey) || data.poolPublicKey.length < 10) throw { message: "ConnectedPool: poolPublicKey is not correct" };
                if ( typeof data.poolServers !== "object" || data.poolServers === null) throw { message: "ConnectedPool: poolServers is not correct" };

                try{
                    let message = WebDollarCrypto.getBufferRandomValues(32);
                    let answer = await socket.node.sendRequestWaitOnce("server-pool/register-pool/answer", {result: true, serverPoolFee: this.serverPoolManagement.serverPoolSettings.serverPoolFee, messageToSign: message }, "confirmation" );

                    if (answer === null ) throw {message: "Pool Confirmation is null"};
                    if ( answer.result !== true ) throw {message: "Pool Confirmation returned an error ", explanation: answer.message};

                    if (!Buffer.isBuffer(answer.signature) || answer.signature.length <= 5 ) throw {message: "ConnectedPool: Signature is invalid"};

                    if (! ed25519.verify(answer.signature, message, data.poolPublicKey)) throw {message: "ConnectedPool: Signature doesn't validate message"};

                    socket.node.sendRequest("server-pool/register-pool/answer/confirmation/answer", {result: true} );

                    this._addConnectedPool(socket, data.poolPublicKey, data.poolName, data.poolFee, data.poolWebsite, data.poolServers )

                    return true;

                } catch (exception){

                    console.error("ConnectedPool: confirmation returned an error", exception);
                    socket.node.sendRequest("server-pool/register-pool/answer/confirmation/answer", {result: false} );

                }


            } catch (exception){

                console.error("ConnectedPool: register-pool returned an error", exception);
                socket.node.sendRequest("server-pool/register-pool/answer", {result: false} );

            }

        });

    }

    _unsubscribeSocket(nodesListObject) {

        let socket = nodesListObject.socket;

    }

    findPoolByPoolPublicKey(poolPublicKey){

        for (let i=0; i<this.connectedPools.length; i++)
            if (this.connectedPools[i].node.protocol.pool.poolPublicKey.equals(poolPublicKey)){
                return this.connectedPools[i];
            }

        return null;
    }

    _addConnectedPool(socket, poolPublicKey, poolName, poolFee, poolWebsite, poolServers){

        socket.node.protocol.pool = {

            poolPublicKey: poolPublicKey,
            poolFee: poolFee,
            poolName: poolName,
            poolWebsite: poolWebsite,
            poolServers: poolServers,

        };

        socket.node.protocol.nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_POOL;

        this.addElement(socket);


        //verify if there are any connectedMiners that are looking for that protocol
        let connectedMiners = this.serverPoolManagement.serverPoolProtocol.serverPoolConnectedMinersProtocol.connectedMiners;
        for (let i=0; i<connectedMiners.length; i++)
            if (connectedMiners[i].node.protocol.minerPool.poolPublicKey.equals(poolPublicKey)){

            }


    }


}

export default ServerPoolConnectedPoolsProtocol;