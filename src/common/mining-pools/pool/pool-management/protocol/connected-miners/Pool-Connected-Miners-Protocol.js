import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesList from 'node/lists/Nodes-List';
import NODE_TYPE from "node/lists/types/Node-Type";
import NODE_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type"
import PoolsUtils from "common/mining-pools/common/Pools-Utils"
import PoolProtocolList from "common/mining-pools/common/Pool-Protocol-List"
import consts from 'consts/const_global'
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
import ed25519 from "common/crypto/ed25519";

class PoolConnectedMinersProtocol extends PoolProtocolList{

    constructor(poolManagement){

        super();

        this.poolManagement = poolManagement;

        this.connectedMiners = [];
        this.list = this.connectedMiners;

    }

    async startPoolConnectedMinersProtocol(){

        NodesList.emitter.on("nodes-list/connected", async (nodesListObject) => {
            await this._subscribePoolConnectedMiners(nodesListObject)
        });

        for (let i=0; i<NodesList.nodes.length; i++)
            await this._subscribePoolConnectedMiners(NodesList.nodes[i]);

    }

    async _subscribePoolConnectedMiners(nodesListObject){

        let socket = nodesListObject.socket;

        if (!this.poolManagement.poolStarted) return false;

        if ( !(socket.node.protocol.nodeType === NODE_TYPE.NODE_TERMINAL && socket.node.protocol.nodeConsensusType === NODE_CONSENSUS_TYPE.NODE_CONSENSUS_POOL ||
             socket.node.protocol.nodeType === NODE_TYPE.NODE_WEB_PEER && socket.node.protocol.nodeConsensusType === NODE_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER_FOR_MINER )){

            return false;

        }


        socket.node.on("mining-pool/hello-pool", async (data) => {

            try{

                if ( !Buffer.isBuffer( data.message )  || data.message.length !== 32) throw {message: "message is invalid"};
                if ( !Buffer.isBuffer( data.poolPublicKey )  || data.poolPublicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "poolPublicKey is invalid"};

                //validate poolPublicKey
                if ( ! data.poolPublicKey.equals( this.poolManagement.poolSettings.poolPublicKey )) throw {message: "poolPublicKey doesn't match"};

                if ( !Buffer.isBuffer( data.minerPublicKey )  || data.minerPublicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "minerPublicKey is invalid"};

                if ( typeof data.minerAddress !== "string" ) throw { message: "minerAddress is not correct" };
                let unencodedAddress = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF( data.minerAddress );
                if (unencodedAddress === null) throw { message: "minerAddress is not correct" };

                //validate minerPool signature
                if ( !Buffer.isBuffer( data.messageSignature ) || data.messageSignature.length < 10) throw {message: "messageSignature is invalid"};
                if ( !ed25519.verify(data.messageSignature, data.message, data.minerPublicKey)) throw {message: "messageSignature doesn't validate message"}


                // save minerPublicKey
                let miner = this.poolManagement.poolData.getMiner(data.minerAddress);

                if (miner === null )
                    miner = await this.poolManagement.poolData.addMiner(data.minerAddress);

                miner.addInstance(data.minerPublicKey);

                let signature = this.poolManagement.poolSettings.poolDigitalSign(data.message);

                let suffix = "";
                if ( typeof data.suffix === "string")
                    suffix = data.suffix;

                socket.node.sendRequest("mining-pool/hello-pool/answer"+suffix, {
                    result: true,
                    signature: signature,
                } );

            } catch (exception){

                socket.node.sendRequest("mining-pool/hello-pool"+"/answer", {result: false, message: exception.message, } );
            }

        });

        //TODO change-wallet
        socket.node.on("mining-pool/change-wallet", (data) => {

            try{

                if (Buffer.isBuffer( data.address )  || data.address.length !== consts.ADDRESSES.ADDRESS.LENGTH) throw {message: "address is invalid"};
                if (Buffer.isBuffer( data.publicKey)  || data.publicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "publicKey is invalid"};

                let miner = this.poolManagement.poolData.getMiner(data.address);
                if (miner === null) throw {message: "mine was not found"};



            } catch (exception){
                socket.node.sendRequest("mining-pool/change-wallet"+"/answer", {result: false, message: exception.message } )
            }

        });

        //TODO request reward
        socket.node.on("mining-pool/request-reward", async (data) => {

            try {

                if (Buffer.isBuffer( data.minerAddress )  || data.minerAddress.length !== consts.ADDRESSES.ADDRESS.LENGTH) throw {message: "minerAddress is invalid"};

                // load minerPublicKey
                let miner = this.poolManagement.poolData.getMiner(data.minerAddress);
                if (miner === null) throw {message: "mine was not found"};

                let answer = await this.poolManagement.sendReward(data.minerAddress);

                socket.node.sendRequest("mining-pool/request-reward"+"/answer", {result: answer } )

            } catch (exception) {
                socket.node.sendRequest("mining-pool/request-reward"+"/answer", {result: false, message: exception.message } )
            }
        });

        socket.node.on("mining-pool/work-done", (data) => {

            try{

                if (Buffer.isBuffer( data.minerPublicKey )  || data.minerPublicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "minerPublicKey is invalid"};

                let minerInstance = this.poolManagement.poolData.getMinerInstanceByPublicKey(data.minerPublicKey);
                if (minerInstance === null) throw {message: "publicKey was not found"};

                let answer = this.poolManagement.receivePoolWork(minerInstance, data.work);

                let newWork = this.poolManagement.getWork(minerInstance);

                socket.node.sendRequest("mining-pool/work-done"+"/answer", {result: true, answer: answer.result, reward: answer.reward, newWork: newWork } ); //the new reward

            } catch (exception){
                socket.node.sendRequest("mining-pool/get-miner-work"+"/answer", {result: false, message: exception.message } )
            }

        });

        socket.node.on("mining-pool/get-miner-work", (data) => {

            try {

                if (Buffer.isBuffer( data.minerPublicKey )  || data.minerPublicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "minerPublicKey is invalid"};

                let minerInstance = this.poolManagement.poolData.getMinerInstanceByPublicKey(data.minerPublicKey);
                if (minerInstance === null) throw {message: "publicKey was not found"};

                let work = this.poolManagement.generatePoolWork(minerInstance);

                socket.node.sendRequest("mining-pool/get-miner-work"+"/answer", {result: true, work: work } )

            } catch (exception){

                socket.node.sendRequest("mining-pool/get-miner-work"+"/answer", {result: false, message: exception.message } );

            }

        });

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

            if ( answer === null || answer.result !== true) throw {message: "ServerPool returned false"};
            if ( typeof answer.serverPoolFee !== "number" ) throw {message: "ServerPool returned a wrong fee"};
            if ( answer.serverPoolFee < 0 || answer.serverPoolFee > 1) throw {message: "ServerPool returned a wrong fee"};
            if ( !Buffer.isBuffer(answer.messageToSign) || answer.messageToSign.length !== 32) throw {message: "ServerPool message is wrong"};

            if (answer.serverPoolFee > 0.2){

                await socket.node.sendRequestWaitOnce("server-pool/register-pool/answer/confirmation", { result: false, message: "ServerPool fee is too high"}, "answer");

                setTimeout(()=>{
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

    _addConnectedMinerPool(socket, socketAddress){

        socket.node.protocol.minerPool = {
            socketAddress: socketAddress,
        };

        socket.node.protocol.nodeConsensusType = NODE_CONSENSUS_TYPE.NODE_CONSENSUS_MINER_POOL;

        this.addElement(socket);

    }

}

export default PoolConnectedMinersProtocol;