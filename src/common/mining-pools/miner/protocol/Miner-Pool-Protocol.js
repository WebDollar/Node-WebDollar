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
                pool: this.minerPoolManagement.minerPoolSettings.poolPublicKey,
                miner: this.minerPoolManagement.minerPoolSettings.minerPoolPublicKey,
                minerAddress: Blockchain.blockchain.mining.minerAddress,
            }, "answer", 6000  );


            if (answer === null ) throw {message: "pool : didn't respond"}; //in case there was an error message
            if (answer.result !== true) throw {message: "pool : result is not true" + answer.message} //in case there was an error message

            try{

                if (typeof answer.name !== 'string') throw {message: "pool: name is invalid"};
                if (typeof answer.fee !== 'number') throw {message: "pool:  fee is invalid"};
                if (typeof answer.website !== 'string') throw {message: "pool:  website is invalid"};
                if (typeof answer.useSig !== 'boolean') throw {message: "pool:  useSignatures is invalid"};
                if ( !Array.isArray(answer.servers) ) throw {message: "pool:  servers is invalid"};

                let poolName = answer.name;
                let poolFee = answer.fee;
                let poolWebsite = answer.website;
                let poolUseSignatures = answer.useSig;
                let poolServers = answer.servers;

                if ( !Buffer.isBuffer(answer.signature) || answer.signature.length < 10 ) throw {message: "pool: signature is invalid"};

                let newMessage = Buffer.concat([
                    message,
                    Buffer.from( poolName, "ascii"),
                    Buffer.from( poolFee.toString(), "ascii"),
                    Buffer.from( poolWebsite, "ascii"),
                    Buffer.from( JSON.stringify(poolServers), "ascii"),
                    Buffer.from( poolUseSignatures.toString(), "ascii"),
                ]);

                if (! ed25519.verify(answer.signature, newMessage, this.minerPoolManagement.minerPoolSettings.poolPublicKey)) throw {message: "pool: signature doesn't validate message"};

                if ( typeof answer.reward !== "number") throw {message: "pool: Reward is empty"};
                if ( typeof answer.confirmed !== "number") throw {message: "pool: confirmedReward is empty"};

                socket.node.sendRequest("mining-pool/hello-pool/answer/confirmation", {result: true});

                this.minerPoolManagement.minerPoolReward.confirmedReward = answer.confirmed;
                this.minerPoolManagement.minerPoolReward.totalReward = answer.reward;

                this.minerPoolManagement.minerPoolSettings.poolName = poolName;
                this.minerPoolManagement.minerPoolSettings.poolFee = poolFee;
                this.minerPoolManagement.minerPoolSettings.poolWebsite = poolWebsite;
                this.minerPoolManagement.minerPoolSettings.poolUseSignatures = poolUseSignatures;
                this.minerPoolManagement.minerPoolSettings.poolFee = poolServers;

                //connection established
                await this._connectionEstablishedWithPool(socket);

                this._updateStatistics(answer);

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


    async _connectionEstablishedWithPool(socket ){

        socket.node.protocol.pool = {
        };

        socket.node.protocol.nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_POOL;

        this.addElement(socket);

        StatusEvents.emit("miner-pool/servers-connections", {message: "Server Added"});

        console.info("Miner Pool: connection established");

        StatusEvents.emit("miner-pool/connection-established", {connected: true, message: "Connection Established", socket: socket});


        socket.node.on("mining-pool/new-work", async (data)=>{

            try {
                if (typeof data.work !== "object") throw {message: "new-work invalid work"};
                if (!Buffer.isBuffer(data.miner)) throw {message: "new-work invalid minerPublicKey"};
                if (!Buffer.isBuffer(data.miner)) throw {message: "new-work invalid minerPublicKey"};

                let confirmation = socket.node.sendRequestWaitOnce("mining-pool/new-work/answer", {
                    hash: this.minerPoolManagement.minerPoolMining.bestHash,
                    nonce: this.minerPoolManagement.minerPoolMining.bestHashNonce
                }, "confirm");

                this._validateRequestWork(data.work);
                this.minerPoolManagement.minerPoolMining.updatePoolMiningWork(data.work, socket);

                let answer = await confirmation;

                if (answer === null) throw {message: "new-work: confirmation reaised an error"};

                this._updateStatistics( answer );

                this.minerPoolManagement.minerPoolReward.totalReward = answer.reward;
                this.minerPoolManagement.minerPoolReward.confirmedReward = answer.confirmed;

            } catch (exception){
                console.error("new work raised an exception", exception);
            }

        });


    }

    _validateRequestWork(work){

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

        if (this.minerPoolManagement.minerPoolSettings.poolUseSignatures) {
            let message = Buffer.concat( [ work.block, Serialization.serializeNumber4Bytes( work.start ), Serialization.serializeNumber4Bytes( work.end ) ]);
            if (!Buffer.isBuffer(work.sig) || work.sig.length < 10) throw {message: "pool: signature is invalid"};
            if (!ed25519.verify(work.sig, message, this.minerPoolManagement.minerPoolSettings.poolPublicKey)) throw {message: "pool: signature doesn't validate message"};
        }

    }

    _updateStatistics(data){
        if (typeof data.m === "number") this.minerPoolManagement.minerPoolStatistics.poolMinersOnline = data.m;
        if (typeof data.h === "number") this.minerPoolManagement.minerPoolStatistics.poolHashes = data.h;
        if (typeof data.b === "number") this.minerPoolManagement.minerPoolStatistics.poolBlocksConfirmed = data.b;
        if (typeof data.ub === "number") this.minerPoolManagement.minerPoolStatistics.poolBlocksUnconfirmed = data.ub;
        if (typeof data.t === "number") this.minerPoolManagement.minerPoolStatistics.poolTimeRemaining = data.t;
    }

    async requestWork(){

        if (this.connectedPools.length === 0) return;
        let poolSocket = this.connectedPools[0];

        let answer = await poolSocket.node.sendRequestWaitOnce("mining-pool/get-work", {
            miner: this.minerPoolManagement.minerPoolSettings.minerPoolPublicKey,
            pool: this.minerPoolManagement.minerPoolSettings.poolPublicKey,
        }, "answer", 6000);

        if (answer === null) throw {message: "get-work answered null" };

        if (answer.result !== true) throw {message: "get-work answered false"};

        this.minerPoolManagement.minerPoolReward.totalReward = answer.reward;
        this.minerPoolManagement.minerPoolReward.confirmedReward = answer.confirmed;

        this._validateRequestWork( answer.work);
        this.minerPoolManagement.minerPoolMining.updatePoolMiningWork(answer.work, poolSocket);

        this._updateStatistics(answer);

        return true;
    }

    async pushWork(poolSocket, miningAnswer ){

        try {

            if (poolSocket === null) throw {message: "poolSocket is null"};

            let answer = await poolSocket.node.sendRequestWaitOnce("mining-pool/work-done", {
                pool: this.minerPoolManagement.minerPoolSettings.poolPublicKey,
                miner: this.minerPoolManagement.minerPoolSettings.minerPoolPublicKey,
                work: miningAnswer,
            }, "answer", 6000);

            if (answer === null) throw {message: "WorkDone: Answer is null"};
            if (answer.result !== true) throw {message: "WorkDone: Result is not True", reason: answer.message};


            this.minerPoolManagement.minerPoolReward.totalReward = answer.reward;
            this.minerPoolManagement.minerPoolReward.confirmedReward = answer.confirmed;

            this._validateRequestWork( answer.newWork);
            this.minerPoolManagement.minerPoolMining.updatePoolMiningWork(answer.newWork, poolSocket);

            this._updateStatistics(answer);

        } catch (exception){

            console.error("PushWork raised an error", exception);
            return false;

        }

    }


}

export default MinerProtocol;