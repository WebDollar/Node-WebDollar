import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesList from 'node/lists/Nodes-List';
import NODE_TYPE from "node/lists/types/Node-Type";
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"
import PoolsUtils from "common/mining-pools/common/Pools-Utils"
import PoolProtocolList from "common/mining-pools/common/Pool-Protocol-List"
import consts from 'consts/const_global'
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
import ed25519 from "common/crypto/ed25519";
import Serialization from 'common/utils/Serialization';
import Blockchain from "main-blockchain/Blockchain";

class PoolConnectedMinersProtocol extends PoolProtocolList{

    constructor(poolManagement){

        super();

        this.poolManagement = poolManagement;

        this.connectedMiners = [];
        this.list = this.connectedMiners;

    }

    async startPoolConnectedMinersProtocol(){

        for (let i=0; i<NodesList.nodes.length; i++)
            await this._subscribePoolConnectedMiners(NodesList.nodes[i].socket);

        NodesList.emitter.on("nodes-list/connected", async (nodesListObject) => {
            await this._subscribePoolConnectedMiners(nodesListObject.socket)
        });


    }


    async _subscribePoolConnectedMiners(socket){

        if (!this.poolManagement._poolStarted) return;

        if ( !( (socket.node.protocol.nodeType === NODE_TYPE.NODE_TERMINAL && [NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_MINER, NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER].indexOf( socket.node.protocol.nodeConsensusType) >= 0) ||
                (socket.node.protocol.nodeType === NODE_TYPE.NODE_WEB_PEER && [NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_MINER, NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER].indexOf( socket.node.protocol.nodeConsensusType) >= 0 )) ){

            return false;

        }


        socket.node.on("mining-pool/hello-pool", async (data) => {

            if (!this.poolManagement._poolStarted) return;

            try{

                if ( !Buffer.isBuffer( data.message )  || data.message.length !== 32) throw {message: "message is invalid"};
                if ( !Buffer.isBuffer( data.pool )  || data.pool.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "poolPublicKey is invalid"};

                //validate poolPublicKey
                if ( ! data.pool.equals( this.poolManagement.poolSettings.poolPublicKey )) throw {message: "poolPublicKey doesn't match"};

                if ( !Buffer.isBuffer( data.miner )  || data.miner.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "minerPublicKey is invalid"};

                if ( typeof data.minerAddress !== "string" ) throw { message: "minerAddress is not correct" };
                let unencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF( data.minerAddress );
                if (unencodedAddress === null) throw { message: "minerAddress is not correct" };

                // save minerPublicKey
                let miner = this.poolManagement.poolData.getMiner(unencodedAddress);

                if (miner === null )
                    miner = await this.poolManagement.poolData.addMiner(unencodedAddress, data.miner);

                let minerInstance = miner.addInstance(data.miner);
                minerInstance.socket = socket;

                let newMessage = Buffer.concat( [
                    data.message,
                    Buffer.from( this.poolManagement.poolSettings.poolName, "ascii"),
                    Buffer.from( this.poolManagement.poolSettings.poolFee.toString(), "ascii"),
                    Buffer.from( this.poolManagement.poolSettings.poolWebsite, "ascii"),
                    Buffer.from( JSON.stringify(this.poolManagement.poolSettings.poolServers), "ascii"),
                    Buffer.from( this.poolManagement.poolSettings.poolUseSignatures.toString(), "ascii"),
                ]);

                let signature = this.poolManagement.poolSettings.poolDigitalSign( newMessage );


                //in case there is an suffix in the answer
                let suffix = "";
                if ( typeof data.suffix === "string")
                    suffix = '/'+data.suffix;

                this.poolManagement.poolData.lastBlockInformation._findBlockInformationMinerInstance(minerInstance);

                let confirmation = await socket.node.sendRequestWaitOnce("mining-pool/hello-pool/answer"+suffix, {

                    result: true,
                    signature: signature,
                    v: 0x00,

                    name: this.poolManagement.poolSettings.poolName,
                    fee: this.poolManagement.poolSettings.poolFee,
                    website: this.poolManagement.poolSettings.poolWebsite,
                    useSig: this.poolManagement.poolSettings.poolUseSignatures,
                    servers: this.poolManagement.poolSettings.poolServers,

                    reward: minerInstance.miner.rewardTotal,
                    confirmed: minerInstance.miner.rewardConfirmedTotal,

                    h:this.poolManagement.poolStatistics.poolHashes,
                    m: this.poolManagement.poolStatistics.poolMinersOnline.length,
                    t: this.poolManagement.poolStatistics.poolTimeRemaining,

                }, "confirmation", 16000 );

                try {

                    if (confirmation === null) throw {message: "confirmation is empty"};

                    if (!confirmation.result) throw {message: "confirmation is false"};

                    if (confirmation.result){

                        this._addConnectedMinerPool(socket, confirmation.sckAddress || socket.node.sckAddress.address, minerInstance);

                        return true;

                    }

                } catch (exception){
                    console.error("mining-pool/hello-pool/answer/confirmation", exception);
                    console.error("exception", exception)
                }

            } catch (exception){

                console.log("mining-pool/hello-pool"+"/answer", exception);
                socket.node.sendRequest("mining-pool/hello-pool"+"/answer", {result: false, message: exception.message, } );
            }

            return false;

        });



        socket.node.on("mining-pool/get-work", async (data) => {

            if (!this.poolManagement._poolStarted) return;

            //in case there is an suffix in the answer
            let suffix = "";
            if ( typeof data.suffix === "string")
                suffix = '/'+data.suffix;

            try {

                if (!Buffer.isBuffer( data.miner )  || data.miner.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "minerPublicKey is invalid"};
                if (!Buffer.isBuffer( data.pool )  || data.pool.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "poolPublicKey is invalid"};

                if (! data.pool.equals(Blockchain.PoolManagement.poolSettings.poolPublicKey )) throw {message: "poolPublicKey is invalid"};

                let minerInstance = this.poolManagement.poolData.getMinerInstanceByPublicKey(data.miner);
                if (minerInstance === null || minerInstance === undefined) throw {message: "publicKey was not found"};

                let work = await this.poolManagement.generatePoolWork(minerInstance, true);

                minerInstance.socket = socket;

                socket.node.sendRequest("mining-pool/get-work/answer"+suffix, {result: true, work: work, reward: minerInstance.miner.rewardTotal, confirmed: minerInstance.miner.rewardConfirmedTotal,
                    h:this.poolManagement.poolStatistics.poolHashes, m: this.poolManagement.poolStatistics.poolMinersOnline.length, b: this.poolManagement.poolStatistics.poolBlocksConfirmed + this.poolManagement.poolStatistics.poolBlocksConfirmedAndPaid, ub: this.poolManagement.poolStatistics.poolBlocksUnconfirmed, t: this.poolManagement.poolStatistics.poolTimeRemaining,  } )


            } catch (exception){

                socket.node.sendRequest("mining-pool/get-work/answer", {result: false, message: exception.message } );

            }

        });



        socket.node.on("mining-pool/work-done", async (data) => {

            if (!this.poolManagement._poolStarted) return;

            //in case there is an suffix in the answer
            let suffix = "";
            if ( typeof data.suffix === "string")
                suffix = '/'+data.suffix;

            try{

                if (! Buffer.isBuffer( data.miner )  || data.miner.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "minerPublicKey is invalid"};
                if (!Buffer.isBuffer( data.pool )  || data.pool.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "poolPublicKey is invalid"};
                if (! data.pool.equals(Blockchain.PoolManagement.poolSettings.poolPublicKey )) throw {message: "poolPublicKey is invalid"};

                let minerInstance = this.poolManagement.poolData.getMinerInstanceByPublicKey(data.miner);
                if (minerInstance === null || minerInstance === undefined) throw {message: "publicKey was not found"};

                let answer = await this.poolManagement.receivePoolWork(minerInstance, data.work);

                let newWork = await this.poolManagement.generatePoolWork(minerInstance, true);

                //the new reward
                socket.node.sendRequest("mining-pool/work-done/answer"+suffix, {result: true, answer: answer.result, reward: minerInstance.miner.rewardTotal, confirmed: minerInstance.miner.rewardConfirmedTotal, newWork: newWork,
                    h:this.poolManagement.poolStatistics.poolHashes, m: this.poolManagement.poolStatistics.poolMinersOnline.length, b: this.poolManagement.poolStatistics.poolBlocksConfirmed + this.poolManagement.poolStatistics.poolBlocksConfirmedAndPaid, ub: this.poolManagement.poolStatistics.poolBlocksUnconfirmed, t: this.poolManagement.poolStatistics.poolTimeRemaining } );


            } catch (exception){
                socket.node.sendRequest("mining-pool/work-done/answer"+suffix, {result: false, message: exception.message } )
            }

        });



        //TODO change-wallet
        socket.node.on("mining-pool/change-wallet", (data) => {

            if (!this.poolManagement._poolStarted) return;

            try{

                if (Buffer.isBuffer( data.address )  || data.address.length !== consts.ADDRESSES.ADDRESS.LENGTH) throw {message: "address is invalid"};
                if (Buffer.isBuffer( data.miner)  || data.miner.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "publicKey is invalid"};

                let miner = this.poolManagement.poolData.getMiner(data.address);
                if (miner === null) throw {message: "mine was not found"};



            } catch (exception){
                socket.node.sendRequest("mining-pool/change-wallet"+"/answer", {result: false, message: exception.message } )
            }

        });

        //TODO request reward
        socket.node.on("mining-pool/request-reward", async (data) => {

            if (!this.poolManagement._poolStarted) return;

            try {

                if (Buffer.isBuffer( data.minerAddress )  || data.minerAddress.length !== consts.ADDRESSES.ADDRESS.LENGTH) throw {message: "minerAddress is invalid"};

                // load minerPublicKey
                let miner = this.poolManagement.poolData.getMiner(data.minerAddress);
                if (miner === null) throw {message: "mine was not found"};

//                let answer = await this.poolManagement.sendReward(data.minerAddress);
                let answer = false;

                socket.node.sendRequest("mining-pool/request-reward"+"/answer", {result: answer } )

            } catch (exception) {
                socket.node.sendRequest("mining-pool/request-reward"+"/answer", {result: false, message: exception.message } )
            }
        });

    }



    _addConnectedMinerPool(socket, socketAddress, minerInstance){

        socket.node.protocol.minerPool = {
            socketAddress: socketAddress,
        };

        socket.node.protocol.nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_MINER_POOL;

        this.addElement(socket);

        minerInstance.dateActivity = new Date().getTime();
        this.poolManagement.poolData.connectedMinerInstances.addElement(minerInstance);

    }


}

export default PoolConnectedMinersProtocol;