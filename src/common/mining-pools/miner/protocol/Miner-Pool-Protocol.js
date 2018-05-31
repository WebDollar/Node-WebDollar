import consts from "consts/const_global";
import NodesList from "node/lists/Nodes-List";
import Serialization from "common/utils/Serialization";
import PoolMiningWorker from "common/mining-pools/miner/miner-pool/Pool-Mining-Worker";
import CONNECTIONS_TYPE from "node/lists/types/Connections-Type"
import Blockchain from "main-blockchain/Blockchain"
import WebDollarCrypto from "../../../crypto/WebDollar-Crypto";

class MinerProtocol {

    /**
     *
     * @param poolData should contain connectivity information
     */
    constructor(miningFeeThreshold, poolURL){

        this.poolURL = poolURL;

        NodesList.emitter.on("nodes-list/connected", (nodesListObject) => {
            this._subscribeMiner(nodesListObject)
        });

        NodesList.emitter.on("nodes-list/disconnected", ( nodesListObject ) => {
            this._unsubscribeMiner( nodesListObject )
        });

    }


    requestPoolWork(socket){



    }

    async _subscribeMiner(nodesListObject){

        if ([ CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET, CONNECTIONS_TYPE.CONNECTION_SERVER_SOCKET ].indexOf(nodesListObject.connectionType) <= 0) return false;

        //if it is not a server
        await this._sendPoolHello(nodesListObject.socket);

    }

    _unsubscribeMiner(){

    }


    async _sendPoolHello(socket){

        let privateKey = WebDollarCrypto.getBufferRandomValues(64);

        let request = {

            message: message,
            minerPublicKey: publicKey,
            minerAddress: Blockchain.blockchain.mining.minerAddress,

        };

        let answer = await socket.sendRequestWaitOnce( "mining-pool/hello-pool", request, "answer"  );

    }

}

export default MinerProtocol;