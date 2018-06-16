import NodesList from 'node/lists/Nodes-List';
import consts from 'consts/const_global'
import InterfaceBlockchainAddressHelper from "../../../../blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
import PoolProtocolList from "common/mining-pools/common/Pool-Protocol-List"
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"

class ServerPoolConnectedMinersProtocol extends  PoolProtocolList{


    constructor(serverPoolManagement){

        super();

        this.serverPoolManagement = serverPoolManagement;
        this.loaded = false;

        this.connectedMiners = [];
        this.list = this.connectedMiners;

    }

    startServerPoolConnectedPoolsProtocol(){

        if (this.loaded) return;

        NodesList.emitter.on("nodes-list/connected", (result) => {
            this._subscribeSocket(result)
        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeSocket(result)
        });

        for (let i=0; i<NodesList.nodes.length; i++)
            this._subscribeSocket(NodesList.nodes[i]);


        this.loaded = true;
    }

    _subscribeSocket(nodesListObject) {

        let socket = nodesListObject.socket;

        if (!this.serverPoolManagement.serverPoolStarted) return; //meanwhile it was suspended

        socket.node.on("mining-pool/hello-pool", async (data) => {

            if (!this.serverPoolManagement.serverPoolStarted) return; //meanwhile it was suspended

            try {

                if (!Buffer.isBuffer(data.poolPublicKey) || data.poolPublicKey.length < 10) throw { message: "poolPublicKey is not correct" };
                if (!Buffer.isBuffer(data.message) || data.message !== 32) throw { message: "poolMessage is not correct" };

                if (!Buffer.isBuffer(data.minerPublicKey) || data.minerPublicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw { message: "poolMessage is not correct" };
                if ( typeof data.minerAddress !== "string" ) throw { message: "minerAddress is not correct" };

                let unencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF( data.minerAddress );
                if (unencodedAddress === null) throw { message: "minerAddress is not correct" };

                if (Buffer.isBuffer( data.messageSignature ) || data.messageSignature.length < 10) throw {message: "messageSignature is invalid"};
                if (! ed25519.verify(data.messageSignature, data.message, data.minerPublicKey)) throw {message: "messageSignature doesn't validate message"}

                //find the pool by poolPublicKey

                let socketPool = this.serverPoolManagement.serverPoolProtocol.serverPoolConnectedPoolsProtocol.findPoolByPoolPublicKey(data.poolPublicKey);

                if (socketPool === null)
                    throw {message: "pool was not found in the serverPool"};

                data.suffix = socket.node.sckAddress.uuid;
                let answer = await socketPool.sendRequestWaitOnce("mining-pool/hello-pool", data, "answer"+data.suffix );

                let confirmation = await socket.sendRequestWaitOnce("mining-pool/hello-pool/answer", answer, "confirmation");

                try {
                    if (confirmation === null) throw {message: "confirmation is null"};

                    if (confirmation.result ) {
                        this._addConnectedMiner(socket, data.poolPublicKey, socketPool);
                        return true;
                    }
                } catch (exception){

                }

            } catch (exception){

                socket.node.sendRequest("mining-pool/hello-pool"+"/answer", {result: false, message: exception.message} );

            }

            return false;

        });

    }

    _unsubscribeSocket(nodesListObject) {

        let socket = nodesListObject.socket;

        for (let i=0; i<this.connectedMiners.length; i++)
            if (this.connectedMiners[i].node.protocol.minerPool.poolSocket === socket){
                this.connectedMiners[i].node.protocol.minerPool.poolSocket = null;
            }

    }


    _addConnectedMiner(socket, poolPublicKey, poolSocket){

        socket.node.protocol.minerPool = {
            poolPublicKey: poolPublicKey,
            poolSocket: poolSocket,
        };

        socket.node.protocol.nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_MINER;

        this.addElement(socket);

    }


}

export default ServerPoolConnectedMinersProtocol;