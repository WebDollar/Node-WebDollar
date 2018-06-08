import consts from "consts/const_global";
import NodesList from "node/lists/Nodes-List";
import Serialization from "common/utils/Serialization";
import PoolMiningWorker from "common/mining-pools/miner/miner-pool/mining/Pool-Mining";
import CONNECTIONS_TYPE from "node/lists/types/Connections-Type"
import Blockchain from "main-blockchain/Blockchain"
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";
import ed25519 from "common/crypto/ed25519";

class MinerProtocol {

    /**
     *
     * @param poolData should contain connectivity information
     */
    constructor(minerPoolManagement){

        this.minerPoolManagement = minerPoolManagement;
        this.loaded = false;

        this.socketsPool = [];

    }

    startMinerProtocol(){

        if (this.loaded) return;

        NodesList.emitter.on("nodes-list/connected", (nodesListObject) => {
            this._subscribeMiner(nodesListObject)
        });

        NodesList.emitter.on("nodes-list/disconnected", ( nodesListObject ) => {
            this._unsubscribeMiner( nodesListObject )
        });

        for (let i=0; i<NodesList.nodes.length; i++)
            this._subscribeMiner(NodesList.nodes[i]);

        this.loaded = true;

    }

    requestPoolWork(socket){


    }

    async _subscribeMiner(nodesListObject){

        if ([ CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET, CONNECTIONS_TYPE.CONNECTION_SERVER_SOCKET ].indexOf(nodesListObject.connectionType) <= 0) return false;

        //if it is not a server
        try {

            let answer = await this._sendPoolHello(nodesListObject.socket);

        } catch (exception){

            console.error(exception);
            nodesListObject.socket.disconnect();

        }

    }

    _unsubscribeMiner(nodesListObject){

        let socket = nodesListObject.socket;

        for (let i=this.socketsPool.length-1; i>=0; i--)
            if (this.socketsPool[i] === socket){
                this.socketsPool.splice(i,1);
            }

    }


    async _sendPoolHello(socket){

        let message = WebDollarCrypto.getBufferRandomValues(32);

        let answer = await socket.sendRequestWaitOnce( "mining-pool/hello-pool", {
            message: message,
            messageSignature: this.minerPoolManagement.minerPoolSettings.minerPoolDigitalSign(message),
            poolPublicKey: this.minerPoolManagement.minerPoolSettings.poolPublicKey,
            minerPublicKey: this.minerPoolManagement.minerPoolSettings.minerPoolPublicKey,
            minerAddress: Blockchain.blockchain.mining.minerAddress,
        }, "answer"  );

        if (answer === null) throw {message: "pool : no answer from"};

        if (answer.result !== true) throw {message: "pool : result is not true" + answer.message} //in case there was an error message

        if ( !Buffer.isBuffer(answer.signature) || answer.signature.length < 10 ) throw {message: "pool: signature is invalid"};

        if (! ed25519.verify(answer.signature, message, this.minerPoolManagement.minerPoolSettings.poolPublicKey)) throw {message: "pool: signature doesn't validate message"};

        //connection established
        this._connectionEstablishedWithPool(socket);

        return true;

    }

    _connectionEstablishedWithPool(socket){

        if (this._findSocketPool(socket) !== -1) return false;

        this.socketsPool.push(socket);

    }

    _findSocketPool(socket){

        for (let i=0; i<this.socketsPool.length; i++)
            if (this.socketsPool[i] === socket){
                return i;
            }

        return -1;

    }

}

export default MinerProtocol;