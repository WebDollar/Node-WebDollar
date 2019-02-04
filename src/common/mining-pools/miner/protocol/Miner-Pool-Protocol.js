import NodesList from "node/lists/Nodes-List";
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import Blockchain from "main-blockchain/Blockchain"
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";
import ed25519 from "common/crypto/ed25519";
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"
import PoolsUtils from "common/mining-pools/common/Pools-Utils"
import PoolProtocolList from "common/mining-pools/common/Pool-Protocol-List"
import Serialization from "common/utils/Serialization";
import StatusEvents from "common/events/Status-Events";
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import AdvancedMessages from "node/menu/Advanced-Messages";
import consts from "consts/const_global"
import Log from 'common/utils/logging/Log';
import AGENT_STATUS from "../../../blockchain/interface-blockchain/agents/Agent-Status";
import WebDollarCoins from "../../../utils/coins/WebDollar-Coins";
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

class MinerPoolProtocol extends PoolProtocolList{

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

            let addresses = [];
            for (let i=0; i < Blockchain.Wallet.addresses.length; i++)
                addresses.push( Blockchain.Wallet.addresses[i].unencodedAddress.toString("hex") )

            let answer = await socket.node.sendRequestWaitOnce( "mining-pool/hello-pool", {

                message: message,
                pool: this.minerPoolManagement.minerPoolSettings.poolPublicKey,

                minerAddress: Blockchain.blockchain.mining.minerAddress,

                ref: this.minerPoolManagement.minerPoolSettings.poolReferral !== '' ? this.minerPoolManagement.minerPoolSettings.poolReferral : undefined,

                addresses: addresses,

            }, "answer", 30000  );


            if (answer === null ) throw {message: "pool : didn't respond"}; //in case there was an error message
            if (answer.result !== true) throw {message: "pool : result is not true" + answer.message} //in case there was an error message

            try{

                if (typeof answer.name !== 'string') throw {message: "pool: name is invalid"};
                if (typeof answer.fee !== 'number') throw {message: "pool:  fee is invalid"};
                if (typeof answer.referralFee !== 'number') throw {message: "pool:  referralFee is invalid"};
                if (typeof answer.website !== 'string') throw {message: "pool:  website is invalid"};
                if (typeof answer.useSig !== 'boolean') throw {message: "pool:  useSignatures is invalid"};
                if ( !Array.isArray(answer.servers) ) throw {message: "pool:  servers is invalid"};

                let poolName = answer.name;
                let poolFee = answer.fee;
                let poolAddress = answer.address;
                let poolReferralFee = answer.referralFee;
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

                //if ( typeof answer.reward !== "number") throw {message: "pool: Reward is empty"};
                //if ( typeof answer.confirmed !== "number") throw {message: "pool: confirmedReward is empty"};

                socket.node.sendRequest("mining-pool/hello-pool/answer/confirmation", { result: true });

                this.minerPoolManagement.minerPoolSettings.poolName = poolName;
                this.minerPoolManagement.minerPoolSettings.poolAddress = poolAddress;
                this.minerPoolManagement.minerPoolSettings.poolFee = poolFee;
                this.minerPoolManagement.minerPoolSettings.poolReferralFee = poolReferralFee;
                this.minerPoolManagement.minerPoolSettings.poolWebsite = poolWebsite;
                this.minerPoolManagement.minerPoolSettings.poolUseSignatures = poolUseSignatures;
                //this.minerPoolManagement.minerPoolSettings.poolServers = poolServers;

                this.minerPoolManagement.minerPoolSettings.notifyNewChanges();

                //connection established
                await this._connectionEstablishedWithPool(socket);

                this._updateStatistics(answer);
                this.minerPoolManagement.minerPoolReward.setReward(answer);

                if (answer.work)
                    await this._validateRequestWork(answer.work, socket);

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

        this.minerPoolManagement.minerPoolMining.resetForced = true;
        if (this.minerPoolManagement.minerPoolMining._isBeingMining)
            await this.minerPoolManagement.minerPoolMining._isBeingMining;

        socket.node.protocol.pool = {
        };

        socket.node.protocol.nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_POOL;

        this.addElement(socket);

        StatusEvents.emit("miner-pool/servers-connections", {message: "Server Added"});

        console.info("Miner Pool: connection established");

        StatusEvents.emit("miner-pool/connection-established", {connected: true, message: "Connection Established", socket: socket});

        if (this.minerPoolManagement.blockchain.agent.status === AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED)
            this.minerPoolManagement.blockchain.agent.status = AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED;

        socket.node.on("mining-pool/new-work", async (data)=>{

            try {

                if (typeof data.work !== "object") throw {message: "new-work invalid work"};

                //await this._validateRequestWork( data.work, socket );
                this.minerPoolManagement.minerPoolMining.resetForced = true;

                this._updateStatistics( data);
                this.minerPoolManagement.minerPoolReward.setReward(data);

                this._validateRequestWork( data.work, socket);

            } catch (exception){
                console.error("new work raised an exception", exception);
            }

        });

    }

    async _validateRequestWork(work, socket){

        if (typeof work !== "object") throw {message: "get-work invalid work"};

        if ( typeof work.h !== "number" ) throw {message: "get-work invalid block height"};
        if ( !Buffer.isBuffer(work.t) ) throw {message: "get-work invalid block difficulty target"};
        if ( !Buffer.isBuffer( work.s) ) throw {message: "get-work invalid block header"};

        if (typeof work.start !== "number") throw {message: "get-work invalid noncesStart"};
        if (typeof work.end !== "number") throw {message: "get-work invalid noncesEnd"};

        let serialization = work.s;

        work.block = serialization;

        //verify signature

        if (this.minerPoolManagement.minerPoolSettings.poolUseSignatures) {
            let message = Buffer.concat( [ work.block, Serialization.serializeNumber4Bytes( work.start ), Serialization.serializeNumber4Bytes( work.end ) ]);
            if (!Buffer.isBuffer(work.sig) || work.sig.length < 10) throw {message: "pool: signature is invalid"};
            if (!ed25519.verify(work.sig, message, this.minerPoolManagement.minerPoolSettings.poolPublicKey)) throw {message: "pool: signature doesn't validate message"};
        }

        await this.minerPoolManagement.minerPoolMining.updatePoolMiningWork( work, socket );

    }

    _updateStatistics(data){
        if (typeof data.m === "number") this.minerPoolManagement.minerPoolStatistics.poolMinersOnline = data.m;
        if (typeof data.h === "number") this.minerPoolManagement.minerPoolStatistics.poolHashes = data.h;
        if (typeof data.b === "number") this.minerPoolManagement.minerPoolStatistics.poolBlocksConfirmed = data.b;
        if (typeof data.bp === "number") this.minerPoolManagement.minerPoolStatistics.poolBlocksConfirmedAndPaid = data.bp;
        if (typeof data.ub === "number") this.minerPoolManagement.minerPoolStatistics.poolBlocksUnconfirmed = data.ub;
        if (typeof data.bc === "number") this.minerPoolManagement.minerPoolStatistics.poolBlocksBeingConfirmed = data.bc;
        if (typeof data.t === "number") this.minerPoolManagement.minerPoolStatistics.poolTimeRemaining = data.t;
        if (typeof data.n === "number") Blockchain.blockchain.blocks.networkHashRate = data.n; //network hash rate
    }

    async requestWork(){

        if (this.connectedPools.length === 0) return;
        let poolSocket = this.connectedPools[0];

        let answer = await poolSocket.node.sendRequestWaitOnce("mining-pool/get-work", {}, "answer", 6000);

        if (answer === null) throw {message: "get-work answered null" };

        if (answer.result !== true) throw {message: "get-work answered false"};

        await this._validateRequestWork( answer.work, poolSocket);

        this._updateStatistics(answer);
        this.minerPoolManagement.minerPoolReward.setReward(answer);

        return true;
    }

    async pushWork( miningAnswer, poolSocket){

        try {

            if (!poolSocket )
                poolSocket = this.connectedPools[0];

            if (!poolSocket ) throw {message: "You are disconnected"};

            let answer = poolSocket.node.sendRequestWaitOnce("mining-pool/work-done", {
                work: miningAnswer,
            }, "answer", 5000 );

            Log.info("Push Work: ("+miningAnswer.nonce+")"+ miningAnswer.hash.toString("hex") + " id: " + miningAnswer.id, Log.LOG_TYPE.POOLS);
            if (miningAnswer.pos)
                Log.info( "timestamp " + miningAnswer.pos.timestamp + "   " + "balance " + (Blockchain.AccountantTree.getBalance( Blockchain.blockchain.mining.minerAddress  ) / WebDollarCoins.WEBD), Log.LOG_TYPE.POOLS);

            if (!miningAnswer.result){

                try {

                    Log.warn("Statistics: Real " + Math.floor( miningAnswer.hashes / miningAnswer.timeDiff * 1000 )+ " h/s ", Log.LOG_TYPE.POOLS);

                } catch (exception){

                }

            }

            answer = await answer;

            if ( !answer ) throw {message: "WorkDone: Answer is null"};
            if (answer.result !== true) throw {message: "WorkDone: Result is not True", reason: answer.message};

            this.minerPoolManagement.minerPoolReward.setReward(answer);

            await this._validateRequestWork( answer.newWork||answer.work, poolSocket);

            this._updateStatistics(answer);
            this.minerPoolManagement.minerPoolReward.setReward(answer);

        } catch (exception){

            console.error("PushWork raised an error", exception);
            return false;

        }

    }


    async changeWalletMining( poolSocket, newAddress, oldAddress ){

        if (!this.minerPoolManagement._minerPoolStarted) return;

        try {

            if (!poolSocket )
                poolSocket = this.connectedPools[0];

            if (!newAddress )
                newAddress = Blockchain.Wallet.addresses[0].address;

            if (!poolSocket ) throw {message: "You are disconnected"};

            oldAddress = Blockchain.Wallet.getAddress(oldAddress||this.minerPoolManagement.minerPoolMining.minerAddress);

            if ( !oldAddress ){

                AdvancedMessages.alert("In order to change the wallet, you need to have access to the wallet of the address " + this.minerPoolManagement.minerPoolMining.minerAddress, "Wallet Error", "error", 5000 );
                return;

            }

            let unencodedAddress =  InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF( oldAddress.address );
            let newUnencodedAddress =  InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF( newAddress );

            let message = Buffer.concat([

                unencodedAddress,
                newUnencodedAddress,

            ]);

            let signature = await oldAddress.signMessage ( message, undefined );

            let answer = await poolSocket.node.sendRequestWaitOnce("mining-pool/change-wallet-mining", {


                minerAddress: oldAddress.address,
                minerAddressPublicKey: oldAddress.publicKey,

                newMinerAddress: newAddress,

                signature: signature,
                type: "only instance",

            }, "answer", 6000);

            if (answer === null) throw {message: "pool didn't respond"};
            if (answer.result !== true) throw answer;
            else {

                await this.minerPoolManagement.minerPoolMining._setAddress(  newAddress , false, true);

                this.minerPoolManagement.minerPoolReward.setReward(answer);

                return true;
            }

        } catch (exception){

            console.error("Couldn't change the wallet", exception.message);

            if (oldAddress)
                await this.minerPoolManagement.minerPoolMining._setAddress(  oldAddress.address , false, true);

            return false;

        }

    }

    async askWalletMining(poolSocket){

        if (!this.minerPoolManagement._minerPoolStarted) return;

        try {

            if (poolSocket === undefined)
                poolSocket = this.connectedPools[0];

            if (poolSocket === null || poolSocket === undefined) throw {message: "You are disconnected"};

            let answer = await poolSocket.node.sendRequestWaitOnce("mining-pool/request-wallet-mining", {}, "answer", 6000);

            if (answer === null) throw {message: "pool didn't respond"};

            if (answer.result !== true) throw answer;
            else {

                return {result: true, address: answer.address};

            }

        }
        catch (exception){

            console.error("Couldn't change the wallet", exception);
            return {result:false, message: exception.message}

        }

    }

    async getReferralData(poolSocket){

        try {

            if (poolSocket === undefined)
                poolSocket = this.connectedPools[0];

            if (poolSocket === undefined || poolSocket === null) throw {message: "No Pool Socket"};

            let answer = await poolSocket.node.sendRequestWaitOnce("mining-pool/get-referrals", "get", "answer", 6000);

            return answer;

        } catch (exception){


            console.error("Get Referral Data raised an error", exception);
            return { result: false };

        }


    }

}

export default MinerPoolProtocol;