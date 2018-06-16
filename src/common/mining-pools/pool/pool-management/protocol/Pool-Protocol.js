import consts from 'consts/const_global';
import NodesList from 'node/lists/Nodes-List';
import  Utils from "common/utils/helpers/Utils"
import ed25519 from "common/crypto/ed25519";
import PoolConnectedServerProtocol from "./connected-servers/Pool-Connected-Servers-Protocol"

class PoolProtocol {

    constructor(poolManagement) {

        this.poolManagement = poolManagement;
        this.loaded = false;

        this.poolConnectedServersProtocol = new PoolConnectedServerProtocol(this.poolManagement);

    }

    async _startPoolProtocol(){

        if (this.loaded) return true;

        NodesList.emitter.on("nodes-list/connected", (result) => {
            this._subscribeMiner(result)
        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeMiner(result)
        });

        for (let i=0; i<NodesList.nodes.length; i++)
            this._subscribeMiner(NodesList.nodes[i]);

        await this.poolConnectedServersProtocol.startPoolConnectedServersProtocol();

        this.loaded = true;

        return true;
    }

    _stopPoolProtocol(){

    }

    _subscribeMiner(nodesListObject) {

        let socket = nodesListObject.socket;

        if (!this.poolManagement.poolStarted) return false;

        socket.node.on("mining-pool/hello-pool", (data) => {

            try{

                if (Buffer.isBuffer( data.message )  || data.message.length !== 32) throw {message: "message is invalid"};
                if (Buffer.isBuffer( data.poolPublicKey )  || data.poolPublicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "poolPublicKey is invalid"};

                //validate poolPublicKey
                if ( ! data.poolPublicKey.equals( this.poolManagement.poolSettings.poolPublicKey )) throw {message: "poolPublicKey doesn't match"};

                if (Buffer.isBuffer( data.minerPublicKey )  || data.minerPublicKey.length !== consts.ADDRESSES.PUBLIC_KEY.LENGTH) throw {message: "minerPublicKey is invalid"};
                if (Buffer.isBuffer( data.minerAddress )  || data.minerAddress.length !== consts.ADDRESSES.ADDRESS.LENGTH) throw {message: "minerAddress is invalid"};


                //validate minerPool signature
                if (Buffer.isBuffer( data.messageSignature ) || data.messageSignature.length < 10) throw {message: "messageSignature is invalid"};
                if (! ed25519.verify(data.messageSignature, data.message, data.minerPublicKey)) throw {message: "messageSignature doesn't validate message"}


                // save minerPublicKey
                let miner = this.poolManagement.poolData.getMiner(data.minerAddress);

                if (miner === null )
                    miner = this.poolManagement.poolData.addMiner(data.minerAddress);

                miner.addPublic(data.minerPublicKey);

                let signature = this.poolManagement.poolSettings.poolDigitalSign(data.message);

                socket.node.sendRequest("mining-pool/hello-pool"+"/answer", {
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

    _unsubscribeMiner(nodesListObject) {

        let socket = nodesListObject.socket;

    }


}

export default PoolProtocol;