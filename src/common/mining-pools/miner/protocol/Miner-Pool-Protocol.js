import NodesList from "node/lists/Nodes-List";
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import Blockchain from "main-blockchain/Blockchain"
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";
import ed25519 from "common/crypto/ed25519";
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"
import PoolsUtils from "common/mining-pools/common/Pools-Utils"
import PoolProtocolList from "common/mining-pools/common/Pool-Protocol-List"
import Serialization from "../../../utils/Serialization";

class MinerProtocol extends PoolProtocolList{

    /**
     *
     * @param poolData should contain connectivity information
     */
    constructor(minerPoolManagement){

        super();

        this.minerPoolManagement = minerPoolManagement;
        this.loaded = false;

        this.connectedPools = [];
        this.list = this.connectedPools;

    }

    async _startMinerProtocol(){

        if (this.loaded)
            return true;

        NodesList.emitter.on("nodes-list/connected", async (nodesListObject) => {
            await this._subscribeMiner(nodesListObject)
        });

        NodesList.emitter.on("nodes-list/disconnected", ( nodesListObject ) => {
            this._unsubscribeMiner( nodesListObject )
        });

        for (let i=0; i<NodesList.nodes.length; i++)
            await this._subscribeMiner(NodesList.nodes[i]);

        this.loaded = true;

    }

    async _stopMinerProtocol(){

    }

    async insertServersListWaitlist(serversListArray){

        //remove all p2p sockets
        NodesList.disconnectAllNodesByConsensusType(NODE_CONSENSUS_TYPE.NODE_CONSENSUS_PEER);
        return await PoolsUtils.insertServersListWaitlist(serversListArray, NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_MINER );

    }

    requestPoolWork(socket){


    }

    async _subscribeMiner(nodesListObject){

        let socket = nodesListObject.socket;

        if (!this.minerPoolManagement.minerPoolStarted) return false;

        //if it is not a server
        try {

            if (socket.node.protocol.nodeConsensusType === NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER) {
                let answer = await this._sendPoolHello(socket);

                if (!answer)
                    socket.disconnect();
            }

        } catch (exception){

            console.error("subscribeMiner raised an error", exception);
            socket.disconnect();

        }

    }

    _unsubscribeMiner(nodesListObject){

        let socket = nodesListObject.socket;

    }

    async _sendPoolHello(socket){

        try{

            let message = WebDollarCrypto.getBufferRandomValues(32);

            let answer = await socket.node.sendRequestWaitOnce( "mining-pool/hello-pool", {
                message: message,
                messageSignature: this.minerPoolManagement.minerPoolSettings.minerPoolDigitalSign(message),
                poolPublicKey: this.minerPoolManagement.minerPoolSettings.poolPublicKey,
                minerPublicKey: this.minerPoolManagement.minerPoolSettings.minerPoolPublicKey,
                minerAddress: Blockchain.blockchain.mining.minerAddress,
            }, "answer", 6000  );

            if (answer === null) throw {message: "pool : no answer from"};

            if (answer.result !== true) throw {message: "pool : result is not true" + answer.message} //in case there was an error message

            try{

                if ( !Buffer.isBuffer(answer.signature) || answer.signature.length < 10 ) throw {message: "pool: signature is invalid"};

                if (! ed25519.verify(answer.signature, message, this.minerPoolManagement.minerPoolSettings.poolPublicKey)) throw {message: "pool: signature doesn't validate message"};

                socket.node.sendRequest("mining-pool/hello-pool/answer/confirmation", {result: true});

                //connection established
                this._connectionEstablishedWithPool(socket);

                return true;

            } catch (exception){
                socket.node.sendRequest("mining-pool/hello-pool/answer/confirmation", {result: false, message: exception.message});
            }


        } catch (exception){

        }

    }


    _connectionEstablishedWithPool(socket){

        socket.node.protocol.pool = {
        };

        socket.node.protocol.nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_POOL;

        this.addElement(socket);

    }


    async requestWork(){

        if (this.connectedPools.length === 0) return;
        let poolSocket = this.connectedPools[0];

        let answer = await poolSocket.node.sendRequestWaitOnce("mining-pool/get-work", {
            minerPublicKey: this.minerPoolManagement.minerPoolSettings.minerPoolPublicKey,
            poolPublicKey: this.minerPoolManagement.minerPoolSettings.poolPublicKey,
        }, "answer");

        if (answer === null) throw {message: "get-work answered null" };

        if (answer.result !== true) throw {message: "get-work answered false"};
        if (answer.work !== "object") throw {message: "get-work invalid work"};

        if ( !Buffer.isBuffer( answer.work.block) ) throw {message: "get-work invalid block"};
        if (answer.work.noncesStart !== "number") throw {message: "get-work invalid noncesStart"};
        if (answer.work.noncesEnd !== "number") throw {message: "get-work invalid noncesEnd"};

        //verify signature

        let message = Buffer.concat( [ answer.work.block, Serialization.serializeNumber4Bytes( answer.work.noncesStart ), Serialization.serializeNumber4Bytes( answer.work.noncesEnd ) ]);

        if ( !Buffer.isBuffer(answer.signature) || answer.signature.length < 10 ) throw {message: "pool: signature is invalid"};
        if ( !ed25519.verify(answer.signature, message, this.minerPoolManagement.minerPoolSettings.poolPublicKey)) throw {message: "pool: signature doesn't validate message"};

        this.minerPoolManagement.minerPoolMining.updatePoolMiningWork(answer.work);

        return true;

    }

    async pushWork(poolSocket, bestHash){

        try {

            let answer = await poolSocket.node.sendRequestWaitOnce("mining-pool/work-done", {
                minerPublicKey: this.minerPoolManagement.minerPoolSettings.minerPoolPublicKey,
                bestHash: bestHash
            });

            if (answer === null) throw {message: "WorkDone: Answer is null"};
            if (answer.result !== true) throw {message: "WorkDone: Result is not True"};

            if (answer.result){

            }

        } catch (exception){

            console.error(exception);
            return false;

        }

    }


}

export default MinerProtocol;