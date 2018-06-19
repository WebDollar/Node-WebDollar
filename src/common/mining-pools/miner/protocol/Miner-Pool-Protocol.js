import NodesList from "node/lists/Nodes-List";
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import Blockchain from "main-blockchain/Blockchain"
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";
import ed25519 from "common/crypto/ed25519";
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"
import PoolsUtils from "common/mining-pools/common/Pools-Utils"
import PoolProtocolList from "common/mining-pools/common/Pool-Protocol-List"
import Serialization from "../../../utils/Serialization";
import StatusEvents from "common/events/Status-Events";

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

        if (this.loaded) return true;

        this.loaded = true;

        for (let i=0; i<NodesList.nodes.length; i++)
            await this._subscribeMiner(NodesList.nodes[i]);


        NodesList.emitter.on("nodes-list/connected", async (nodesListObject) => {
            await this._subscribeMiner(nodesListObject)
        });

        NodesList.emitter.on("nodes-list/disconnected", ( nodesListObject ) => {
            this._unsubscribeMiner( nodesListObject )
        });


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
                    throw {message: "send hello is not working"};

                socket.on("mining-pool/hello-pool/again",async (data)=>{

                    await this._sendPoolHello(socket);

                });
            }

        } catch (exception){

            console.error("subscribeMiner raised an error", exception);
            socket.disconnect();

        }

    }

    _unsubscribeMiner(nodesListObject){

        let socket = nodesListObject.socket;

        if (socket.node.protocol.nodeConsensusType === NODE_CONSENSUS_TYPE.NODE_CONSENSUS_POOL)
            StatusEvents.emit("miner-pool/servers-connections", {message: "Server Removed"});

    }

    async _sendPoolHello(socket){

        try{

            let message = WebDollarCrypto.getBufferRandomValues(32);
            //let message = new Buffer(32);

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

                if ( typeof answer.potentialReward !== "number") throw {message: "pool: potentialReward is empty"};
                if ( typeof answer.confirmedReward !== "number") throw {message: "pool: confirmedReward is empty"};

                socket.node.sendRequest("mining-pool/hello-pool/answer/confirmation", {result: true});

                //connection established
                this._connectionEstablishedWithPool(socket, answer.potentialReward, answer.confirmedReward);

                if (typeof answer.m === "number") this.minerPoolManagement.minerPoolStatistics.poolMinersOnline = answer.m;
                if (typeof answer.h === "number") this.minerPoolManagement.minerPoolStatistics.poolHashes = answer.h;

                return true;

            } catch (exception){
                console.error("Exception mining-pool/hello-pool/answer/confirmation", exception);
                socket.node.sendRequest("mining-pool/hello-pool/answer/confirmation", {result: false, message: exception.message});
            }


        } catch (exception){
            console.error("Exception mining-pool/hello-pool/answer", exception);
        }

        return false;

    }


    _connectionEstablishedWithPool(socket, potentialReward, confirmedReward){

        socket.node.protocol.pool = {
        };

        socket.node.protocol.nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_POOL;

        this.minerPoolManagement.minerPoolReward.confirmedReward = confirmedReward;
        this.minerPoolManagement.minerPoolReward.potentialReward = potentialReward;

        this.addElement(socket);

        StatusEvents.emit("miner-pool/servers-connections", {message: "Server Added"});

    }

    _validateRequestWork(work, signature){

        if (typeof work !== "object") throw {message: "get-work invalid work"};

        if ( typeof work.h !== "number" ) throw {message: "get-work invalid block height"};
        if ( !Buffer.isBuffer(work.t) ) throw {message: "get-work invalid block difficulty target"};
        if ( !Buffer.isBuffer( work.s) ) throw {message: "get-work invalid block header"};

        if (typeof work.start !== "number") throw {message: "get-work invalid noncesStart"};
        if (typeof work.end !== "number") throw {message: "get-work invalid noncesEnd"};

        let serialization = Buffer.concat([
            Serialization.serializeBufferRemovingLeadingZeros( Serialization.serializeNumber4Bytes(work.h) ),
            Serialization.serializeBufferRemovingLeadingZeros( work.t ),
            work.s,
        ]);

        work.block = serialization;

        //verify signature

        let message = Buffer.concat( [ work.block, Serialization.serializeNumber4Bytes( work.start ), Serialization.serializeNumber4Bytes( work.end ) ]);

        if ( !Buffer.isBuffer(signature) || signature.length < 10 ) throw {message: "pool: signature is invalid"};
        if ( !ed25519.verify(signature, message, this.minerPoolManagement.minerPoolSettings.poolPublicKey)) throw {message: "pool: signature doesn't validate message"};

    }

    async requestWork(){

        if (this.connectedPools.length === 0) return;
        let poolSocket = this.connectedPools[0];

        let answer = await poolSocket.node.sendRequestWaitOnce("mining-pool/get-work", {
            minerPublicKey: this.minerPoolManagement.minerPoolSettings.minerPoolPublicKey,
            poolPublicKey: this.minerPoolManagement.minerPoolSettings.poolPublicKey,
        }, "answer", 6000);

        if (answer === null) throw {message: "get-work answered null" };

        if (answer.result !== true) throw {message: "get-work answered false"};

        this._validateRequestWork(answer.work, answer.signature);
        this.minerPoolManagement.minerPoolMining.updatePoolMiningWork(answer.work, poolSocket);

        if (typeof answer.m === "number") this.minerPoolManagement.minerPoolStatistics.poolMinersOnline = answer.m;
        if (typeof answer.h === "number") this.minerPoolManagement.minerPoolStatistics.poolHashes = answer.h;

        return true;

    }

    async pushWork(poolSocket, miningAnswer ){

        try {

            let answer = await poolSocket.node.sendRequestWaitOnce("mining-pool/work-done", {
                poolPublicKey: this.minerPoolManagement.minerPoolSettings.poolPublicKey,
                minerPublicKey: this.minerPoolManagement.minerPoolSettings.minerPoolPublicKey,
                work: miningAnswer,
            }, "answer", 6000);

            if (answer === null) throw {message: "WorkDone: Answer is null"};
            if (answer.result !== true) throw {message: "WorkDone: Result is not True", reason: answer.message};

            if (answer.result){

                this.minerPoolManagement.minerPoolReward.potentialReward = answer.potentialReward;
                this.minerPoolManagement.minerPoolReward.confirmedReward = answer.confirmedReward;

                this._validateRequestWork(answer.newWork, answer.signature);
                this.minerPoolManagement.minerPoolMining.updatePoolMiningWork(answer.newWork, poolSocket);

                if (typeof answer.m === "number") this.minerPoolManagement.minerPoolStatistics.poolMinersOnline = answer.m;
                if (typeof answer.h === "number") this.minerPoolManagement.minerPoolStatistics.poolHashes = answer.h;

            } else {

                poolSocket.disconnect(); //the pool socket is not working

            }

        } catch (exception){

            console.error("PushWork raised an error", exception);
            return false;

        }

    }


}

export default MinerProtocol;