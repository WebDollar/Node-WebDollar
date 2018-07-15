import NodesList from 'node/lists/Nodes-List';
import consts from 'consts/const_global'
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
import PoolProtocolList from "common/mining-pools/common/Pool-Protocol-List"
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"
import ed25519 from "common/crypto/ed25519";

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

        socket.node.on("mining-pool/hello-pool", async (data) => {

            if (!this.serverPoolManagement.serverPoolStarted) return; //meanwhile it was suspended

            try {

                if (!Buffer.isBuffer(data.pool) || data.pool.length < 10) throw { message: "poolPublicKey is not correct" };
                if (!Buffer.isBuffer(data.message) || data.message.length !== 32) throw { message: "poolMessage is not correct" };

                if (!Buffer.isBuffer(data.miner) || data.miner.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw { message: "poolMiner is not correct" };

                if ( typeof data.minerAddress !== "string" ) throw { message: "minerAddress is not correct" };
                let unencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF( data.minerAddress );
                if (unencodedAddress === null) throw { message: "minerAddress is not correct" };

                //find the pool by poolPublicKey

                let socketPool = this.serverPoolManagement.serverPoolProtocol.serverPoolConnectedPoolsProtocol.findPoolByPoolPublicKey(data.pool);

                if (socketPool === null)
                    throw {message: "pool was not found in the serverPool"};

                data.suffix = Math.random().toString();
                let answer = await socketPool.node.sendRequestWaitOnce("mining-pool/hello-pool", data, "answer/"+data.suffix );

                if (answer === null) throw {message: "Pool didn't answer"};

                try {

                    let confirmation = await socket.node.sendRequestWaitOnce("mining-pool/hello-pool/answer", answer, "confirmation");

                    if (confirmation === null) throw {message: "confirmation is null"};

                    if (confirmation.result ) {

                        confirmation.sckAddress = socket.node.sckAddress.address;
                        socketPool.node.sendRequest("mining-pool/hello-pool/answer/"+data.suffix+"/confirmation", confirmation);

                        this._addConnectedMiner(socket, data.pool, socketPool);
                        return true;
                    }
                } catch (exception){

                }

            } catch (exception){

                socket.node.sendRequest("mining-pool/hello-pool"+"/answer", {result: false, message: exception.message} );

            }

            return false;

        });

        socket.node.on("mining-pool/get-work", async (data) => {

            try {

                if (!Buffer.isBuffer(data.miner) || data.miner.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "minerPublicKey is invalid"};
                if (!Buffer.isBuffer(data.pool) || data.pool.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "poolPublicKey is invalid"};

                let socketPool = this.serverPoolManagement.serverPoolProtocol.serverPoolConnectedPoolsProtocol.findPoolByPoolPublicKey(data.pool);

                if (socketPool === null)
                    throw {message: "pool was not found in the serverPool"};

                data.suffix = Math.random().toString();
                let answer = await socketPool.node.sendRequestWaitOnce("mining-pool/get-work", data, "answer/"+data.suffix, 6000 );

                if (answer === null) throw {message: "there is a problem with the pool"};

                socket.node.sendRequest("mining-pool/get-work/answer", answer );

            } catch (exception){
                socket.node.sendRequest("mining-pool/get-work/answer", {result: false, message: exception.message } );
            }

        });

        socket.node.on("mining-pool/work-done", async (data) => {

            try {

                if ( !Buffer.isBuffer(data.miner) || data.miner.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "minerPublicKey is invalid"};
                if ( !Buffer.isBuffer(data.pool)  || data.pool.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "poolPublicKey is invalid"};

                let socketPool = this.serverPoolManagement.serverPoolProtocol.serverPoolConnectedPoolsProtocol.findPoolByPoolPublicKey(data.pool);

                if (socketPool === null)
                    throw {message: "pool was not found in the serverPool"};

                data.suffix = Math.random().toString();
                let answer = await socketPool.node.sendRequestWaitOnce("mining-pool/work-done", data, "answer/"+data.suffix, 6000 );

                if (answer === null) throw {message: "there is a problem with the pool"};

                socket.node.sendRequest("mining-pool/work-done/answer", answer );

            } catch (exception){
                socket.node.sendRequest("mining-pool/work-done/answer", {result: false, message: exception.message } );
            }

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