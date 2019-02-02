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
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

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

    _validatePoolMiner(socket){

        if (  (socket.node.protocol.nodeType === NODE_TYPE.NODE_TERMINAL && [NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_MINER, NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER].indexOf( socket.node.protocol.nodeConsensusType) >= 0) ||
              (socket.node.protocol.nodeType === NODE_TYPE.NODE_WEB_PEER && [NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_MINER, NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER].indexOf( socket.node.protocol.nodeConsensusType) >= 0 )){

            return true;

        }

        return false;

    }

    async _subscribePoolConnectedMiners(socket){

        if (!this.poolManagement._poolStarted) return;

        if (!this._validatePoolMiner(socket)) return false;


        socket.node.on("mining-pool/hello-pool", async (data) => {

            try{

                if (!this.poolManagement._poolStarted) return;
                if (!this._validatePoolMiner(socket)) return;
                if (typeof socket.node.protocol.minerPool === "object" && socket.node.protocol.minerPool.socketAddress && socket.node.protocol.minerPool.minerInstance ) return;

                if ( !data ) throw {message: "invalid hello"};

                if ( !Buffer.isBuffer( data.message )  || data.message.length !== 32) throw {message: "message is invalid"};
                if ( !Buffer.isBuffer( data.pool )  || data.pool.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "poolPublicKey is invalid"};

                //validate poolPublicKey
                if ( ! data.pool.equals( this.poolManagement.poolSettings.poolPublicKey )) throw {message: "poolPublicKey doesn't match"};

                if ( typeof data.minerAddress !== "string" ) throw { message: "minerAddress is not correct" };
                let unencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF( data.minerAddress );
                if (unencodedAddress === null) throw { message: "minerAddress is not correct" };

                let addresses = [];
                if (data.addresses)
                    for (let i=0; i < Math.min( 20, data.addresses.length); i++)
                        addresses.push( Buffer.from( data.addresses[i], "hex") );


                // save minerPublicKey
                let miner = this.poolManagement.poolData.findMiner(unencodedAddress);

                if ( !miner )
                    miner = await this.poolManagement.poolData.addMiner(unencodedAddress );

                let minerInstance = miner.addInstance(socket);

                if (addresses.length > 0)
                    minerInstance.addresses = addresses;

                if (data.ref  && (typeof data.ref === "string" || (Buffer.isBuffer(data.ref) && data.ref.length === consts.ADDRESSES.ADDRESS.LENGTH) ))
                    miner.referrals.setReferralLink(data.ref);

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

                //generate a message for confirming pool Owner
                let messageAddressConfirmation = undefined;
                if ( Blockchain.Wallet.getAddress(unencodedAddress) )
                    messageAddressConfirmation = new Buffer(32);

                let work = await this.poolManagement.generatePoolWork(minerInstance, true);
                minerInstance.lastWork = work;

                let confirmation = await socket.node.sendRequestWaitOnce("mining-pool/hello-pool/answer"+suffix, {

                    result: true,
                    signature: signature,
                    v: 0x00,

                    address: this.poolManagement.poolSettings.poolAddress,
                    name: this.poolManagement.poolSettings.poolName,
                    fee: this.poolManagement.poolSettings.poolFee,
                    referralFee: this.poolManagement.poolSettings.poolReferralFee,
                    website: this.poolManagement.poolSettings.poolWebsite,
                    useSig: this.poolManagement.poolSettings.poolUseSignatures,
                    servers: this.poolManagement.poolSettings.poolServers,

                    reward: minerInstance.miner.rewardTotal||0,
                    confirmed: minerInstance.miner.rewardConfirmedTotal||0,
                    refReward: minerInstance.miner.referrals.rewardReferralsTotal||0,
                    refConfirmed: minerInstance.miner.referrals.rewardReferralsConfirmed||0,

                    h:this.poolManagement.poolStatistics.poolHashes,
                    m: this.poolManagement.poolStatistics.poolMinersOnline.length,
                    t: this.poolManagement.poolStatistics.poolTimeRemaining,
                    n: Blockchain.blockchain.blocks.networkHashRate,

                    b: this.poolManagement.poolStatistics.poolBlocksConfirmed,
                    bp: this.poolManagement.poolStatistics.poolBlocksConfirmedAndPaid,
                    ub: this.poolManagement.poolStatistics.poolBlocksUnconfirmed,
                    bc: this.poolManagement.poolStatistics.poolBlocksBeingConfirmed,

                    work: work,

                    msg: messageAddressConfirmation,

                }, "confirmation", 30000 );

                try {

                    if ( !confirmation ) throw {message: "confirmation is empty"};

                    if (!confirmation.result) throw {message: "confirmation is false"};

                    if (confirmation.result){

                        this._addConnectedMinerPool(socket, confirmation.sckAddress || socket.node.sckAddress.address, minerInstance);

                        //checking the person is actually a Pool Owner
                        //validate pool Answer message
                        if ( Blockchain.Wallet.getAddress(unencodedAddress) && Buffer.isBuffer(confirmation.sig) && confirmation.sig.length > 5 ){

                            let address = Blockchain.Wallet.getAddress(unencodedAddress);

                            if ( ed25519.verify( confirmation.sig, messageAddressConfirmation, address.publicKey ) )
                                socket.node.protocol.minerPool.poolOwner = true;

                        }

                        return true;

                    }

                } catch (exception){
                    console.error("mining-pool/hello-pool/answer/confirmation", exception);
                    console.error("exception", exception)
                }

            } catch (exception){

                if (Math.random () < 0.1)
                    console.log("mining-pool/hello-pool"+"/answer", exception);

                socket.node.sendRequest("mining-pool/hello-pool"+"/answer", {result: false, message: exception.message, } );
            }

        });

        socket.node.on("mining-pool/get-work", async (data) => {

            try {

                if (!this.poolManagement._poolStarted) return;

                if ( !data  ) return;

                //in case there is an suffix in the answer
                let suffix = "";
                if ( typeof data.suffix === "string")
                    suffix = '/'+data.suffix;

                if ( !socket.node.protocol.minerPool ) return;

                let minerInstance = socket.node.protocol.minerPool.minerInstance;
                if ( !minerInstance ) throw {message: "publicKey was not found"};

                let work = await this.poolManagement.generatePoolWork(minerInstance, true);
                minerInstance.lastWork = work;

                socket.node.sendRequest("mining-pool/get-work/answer"+suffix, { result: true, work: work, reward: minerInstance.miner.rewardTotal||0, confirmed: minerInstance.miner.rewardConfirmedTotal||0,  refReward: minerInstance.miner.referrals.rewardReferralsTotal||0,  refConfirmed: minerInstance.miner.referrals.rewardReferralsConfirmed||0,
                    h:this.poolManagement.poolStatistics.poolHashes,  m: this.poolManagement.poolStatistics.poolMinersOnline.length,  t: this.poolManagement.poolStatistics.poolTimeRemaining,  n: Blockchain.blockchain.blocks.networkHashRate,
                    b: this.poolManagement.poolStatistics.poolBlocksConfirmed,  bp: this.poolManagement.poolStatistics.poolBlocksConfirmedAndPaid,  ub: this.poolManagement.poolStatistics.poolBlocksUnconfirmed,  bc: this.poolManagement.poolStatistics.poolBlocksBeingConfirmed,
                } )

            } catch (exception){

                socket.node.sendRequest("mining-pool/get-work/answer", {result: false, message: exception.message } );

            }

        });


        socket.node.on("mining-pool/get-referrals", async (data) => {

            try {

                if (!this.poolManagement._poolStarted) return;

                //in case there is an suffix in the answer
                let suffix = "";

                if ( data  && typeof data.suffix === "string")
                    suffix = '/'+data.suffix;

                if ( !socket.node.protocol.minerPool ) return;

                let minerInstance = socket.node.protocol.minerPool.minerInstance;
                if ( !minerInstance ) throw {message: "publicKey was not found"};

                socket.node.sendRequest("mining-pool/get-referrals/answer"+suffix, {result: true, referrals: minerInstance.miner.referrals.toJSON() } );


            } catch (exception){

                socket.node.sendRequest("mining-pool/get-referrals/answer", {result: false, message: exception.message } );

            }

        });

        socket.node.on("mining-pool/work-partially-done", async (data) => {

            try{

                if (!this.poolManagement._poolStarted) return;

                if ( !data  ) return;

                //in case there is an suffix in the answer
                let suffix = "";
                if ( typeof data.suffix === "string")
                    suffix = '/'+data.suffix;

                if ( !socket.node.protocol.minerPool ) return;

                let minerInstance = socket.node.protocol.minerPool.minerInstance;
                if ( !minerInstance ) throw {message: "publicKey was not found"};

                await this.poolManagement.receivePoolWork(minerInstance, data.work);

            } catch (exception){
                socket.node.sendRequest("mining-pool/work-partially-done"+suffix, {result: false, message: exception.message } )
            }


        });

        socket.node.on("mining-pool/work-done", async (data) => {

            try{

                if (!this.poolManagement._poolStarted) return;

                if ( !data  ) return;

                //in case there is an suffix in the answer
                let suffix = "";
                if ( typeof data.suffix === "string")
                    suffix = '/'+data.suffix;

                if ( !socket.node.protocol.minerPool ) return;

                let minerInstance = socket.node.protocol.minerPool.minerInstance;
                if ( !minerInstance ) throw {message: "publicKey was not found"};

                await this.poolManagement.receivePoolWork(minerInstance, data.work);

                let newWork = await this.poolManagement.generatePoolWork(minerInstance, true);
                minerInstance.lastWork = newWork;

                //the new reward
                socket.node.sendRequest("mining-pool/work-done/answer"+suffix, { result: true, newWork: newWork, reward: minerInstance.miner.rewardTotal||0, confirmed: minerInstance.miner.rewardConfirmedTotal||0,  refReward: minerInstance.miner.referrals.rewardReferralsTotal||0,  refConfirmed: minerInstance.miner.referrals.rewardReferralsConfirmed||0,
                                                                                 h:this.poolManagement.poolStatistics.poolHashes,  m: this.poolManagement.poolStatistics.poolMinersOnline.length,  t: this.poolManagement.poolStatistics.poolTimeRemaining,  n: Blockchain.blockchain.blocks.networkHashRate,
                                                                                 b: this.poolManagement.poolStatistics.poolBlocksConfirmed,  bp: this.poolManagement.poolStatistics.poolBlocksConfirmedAndPaid,  ub: this.poolManagement.poolStatistics.poolBlocksUnconfirmed,  bc: this.poolManagement.poolStatistics.poolBlocksBeingConfirmed, } );

            } catch (exception){
                socket.node.sendRequest("mining-pool/work-done/answer"+suffix, {result: false, message: exception.message } )
            }

        });



        socket.node.on("mining-pool/change-wallet-mining", (data) => {

            try {

                if (!this.poolManagement._poolStarted) return;

                if ( !data  ) return;

                if ( !socket.node.protocol.minerPool ) return;


                if ( typeof data.minerAddress !== "string" ) throw { message: "minerAddress is not correct" };
                let unencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF( data.minerAddress );
                if (unencodedAddress === null) throw { message: "minerAddress is not correct" };

                if (!Buffer.isBuffer( data.minerAddressPublicKey)  || data.minerAddressPublicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "minerPublicKey is invalid"};
                let minerAddressPublicKey = data.minerAddressPublicKey;

                //new address

                if ( typeof data.newMinerAddress !== "string" ) throw { message: "newMinerAddress is not correct" };
                let newUnencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF( data.newMinerAddress );
                if (newUnencodedAddress === null) throw { message: "newMinerAddress is not correct" };

                let miner = this.poolManagement.poolData.findMiner(unencodedAddress);
                if (miner === null) throw {message: "miner was not found"};

                let message = Buffer.concat([

                    unencodedAddress,
                    newUnencodedAddress,

                ]);


                let minerInstance = socket.node.protocol.minerPool.minerInstance;
                if (minerInstance === null) throw {message: "minerInstance was not found"};


                if ( !Buffer.isBuffer(data.signature) || data.signature.length < 10 ) throw {message: "pool: signature is invalid"};
                if (! ed25519.verify(data.signature, message, minerAddressPublicKey)) throw {message: "pool: signature doesn't validate message"};

                if ( ! InterfaceBlockchainAddressHelper._generateUnencodedAddressFromPublicKey(minerAddressPublicKey).equals(unencodedAddress)) throw {message: "pool: unencodedAddress doesn't work minerPublicKey"};

                if ( data.type === "only instance" ){

                    miner.removeInstance(minerInstance);

                    let newMiner = this.poolManagement.poolData.addMiner(newUnencodedAddress );
                    minerInstance.miner = newMiner;
                    newMiner.addInstance(minerInstance);

                    miner = newMiner;

                } else if (data.type === "all instances"){

                    miner.address = newUnencodedAddress;

                } else throw {message: "data.type is invalid"};


                socket.node.sendRequest("mining-pool/change-wallet-mining/answer", {result: true, address: InterfaceBlockchainAddressHelper.generateAddressWIF(miner.address), reward: minerInstance.miner.rewardTotal,  confirmed: minerInstance.miner.rewardConfirmedTotal, refReward: minerInstance.miner.referrals.rewardReferralsTotal, refConfirmed: minerInstance.miner.referrals.rewardReferralsConfirmed } )

            } catch (exception){
                socket.node.sendRequest("mining-pool/change-wallet-mining/answer", {result: false, message: exception.message } )
            }

        });


        socket.node.on("mining-pool/request-wallet-mining", (data) => {

            try{

                if ( !data  ) return;

                if ( !socket.node.protocol.minerPool ) return;

                let minerInstance = socket.node.protocol.minerPool.minerInstance;
                if (!minerInstance ) throw {message: "publicKey was not found"};

                socket.node.sendRequest("mining-pool/request-wallet-mining/answer", {result: true, address: InterfaceBlockchainAddressHelper.generateAddressWIF(minerInstance.miner.address) } )

            } catch (exception){
                socket.node.sendRequest("mining-pool/request-wallet-mining/answer", {result: false, message: exception.message } )
            }

        });

        socket.node.on("mining-pool/request-reward", async (data) => {

            try {

                if (!this.poolManagement._poolStarted) return;

                if ( !data ) return;

                if ( !socket.node.protocol.minerPool ) return;

                if (Buffer.isBuffer( data.minerAddress )  || data.minerAddress.length !== consts.ADDRESSES.ADDRESS.LENGTH) throw {message: "minerAddress is invalid"};

                // load minerPublicKey
                let miner = this.poolManagement.poolData.findMiner(data.minerAddress);
                if (miner === null) throw {message: "mine was not found"};

                //let answer = await this.poolManagement.sendReward(data.minerAddress);
                let answer = false;

                socket.node.sendRequest("mining-pool/request-reward"+"/answer", {result: answer } )

            } catch (exception) {
                socket.node.sendRequest("mining-pool/request-reward"+"/answer", {result: false, message: exception.message } )
            }
        });

    }



    _addConnectedMinerPool(socket, socketAddress, minerInstance){

        if (typeof socket.node.protocol.minerPool === "object" && socket.node.protocol.minerPool.socketAddress  && socket.node.protocol.minerPool.minerInstance ) return;

        socket.node.protocol.minerPool = {
            socketAddress: socketAddress,
            minerInstance: minerInstance
        };

        socket.node.protocol.nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_MINER_POOL;

        this.addElement(socket, minerInstance);

    }


    addElement(socket, minerInstance){

        if (!PoolProtocolList.prototype.addElement.call(this, socket)){
            minerInstance.dateActivity = new Date().getTime()/1000;
        }

        minerInstance.socket = socket;
        this.poolManagement.poolData.connectedMinerInstances.addElement(minerInstance);

    }

}

export default PoolConnectedMinersProtocol;