import consts from 'consts/const_global'
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NODE_TYPE from "node/lists/types/Node-Type"
import CONNECTIONS_TYPE from "node/lists/types/Connection-Type"
import NodesList from 'node/lists/Nodes-List'
import Blockchain from "main-blockchain/Blockchain"

class NodeAPIPublic{

    constructor(){

    }

    info(){

        let lastBlock = Blockchain.blockchain.blocks.last;

        return {

            protocol: consts.SETTINGS.NODE.PROTOCOL,
            version: consts.SETTINGS.NODE.VERSION,
            poolURL: Blockchain.PoolManagement.poolSettings.poolURL,
            blocks: {
                length: Blockchain.blockchain.blocks.length,
                lastBlockHash: lastBlock !== undefined ? Blockchain.blockchain.blocks.last.hash.toString("hex") : '',
            },
            networkHashRate: Blockchain.blockchain.blocks.networkHashRate,
            sockets:{
                clients: NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET),
                servers: NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_SERVER_SOCKET),
                webpeers: NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_WEBRTC),
            },
            services:{
                serverPool: Blockchain.ServerPoolManagement.serverPoolProtocol.loaded,
                miningPool: Blockchain.PoolManagement.poolProtocol.loaded,
                minerPool: Blockchain.MinerPoolManagement.minerPoolProtocol.loaded,
            },
            waitlist:{
                list: NodesWaitlist.getJSONList( NODE_TYPE.NODE_TERMINAL, false ),
            }

        };
    }


    helloWorld(req, res){
        return {hello: "world" };
    }

    ping(req, res){
        return {ping: "pong"};
    }

}

export default new NodeAPIPublic();