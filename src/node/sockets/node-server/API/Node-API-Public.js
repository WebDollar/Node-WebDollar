import consts from 'consts/const_global'
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NODE_TYPE from "node/lists/types/Node-Type"
import CONNECTIONS_TYPE from "node/lists/types/Connection-Type"
import NodesList from 'node/lists/Nodes-List'
import Blockchain from "main-blockchain/Blockchain"
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

const UNSYNC_THRESHOLD_MS = 600 * 1000; // ~ 15 blocuri

/**
 * Starea de sincronizare raportată de ruta publică `/`.
 * `lastBlock` poate lipsi când blocurile nu sunt în memorie (salvarea periodică
 * le golește) — atunci răspundem „nesincronizat / necunoscut”, nu cu eroare,
 * ca restul informațiilor (waitlist, servicii, versiune) să rămână vizibile.
 */
export function syncState(lastBlock, nowMs){

    if ( !lastBlock || typeof lastBlock.timeStamp !== "number" )
        return { is_synchronized: false, secondsBehind: null };

    const blockTimestampMs = (lastBlock.timeStamp + BlockchainGenesis.timeStampOffset) * 1000;
    const behindMs = nowMs - blockTimestampMs;

    return { is_synchronized: behindMs < UNSYNC_THRESHOLD_MS, secondsBehind: behindMs / 1000 };
}

class NodeAPIPublic{

    constructor(){

    }

    info(){

        const lastBlock = Blockchain.blockchain.blocks.last;
        const { is_synchronized, secondsBehind } = syncState( lastBlock, new Date().getTime() );

        return {

            protocol: consts.SETTINGS.NODE.PROTOCOL,
            version: consts.SETTINGS.NODE.VERSION,

            poolURL: consts.DEBUG ? Blockchain.PoolManagement.poolSettings.poolURL : '',

            blocks: {
                length: Blockchain.blockchain.blocks.length,
                lastBlockHash: lastBlock ? lastBlock.hash.toString("hex") : '',
            },
            networkHashRate: Blockchain.blockchain.blocks.networkHashRate,
            chainWork: Blockchain.blockchain.blocks.chainWork.toString(),
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
            },
            is_synchronized: is_synchronized,
            secondsBehind  : secondsBehind

        };
    }

    top(){

        let is_synchronized    = false;
        let currentTimestamp   = new Date().getTime();
        let oDate              = new Date((Blockchain.blockchain.blocks.last.timeStamp + BlockchainGenesis.timeStampOffset) * 1000);
        let blockTimestamp     = oDate.getTime();
        let nSecondsBehind     = currentTimestamp - blockTimestamp;

        const UNSYNC_THRESHOLD = 600 * 1000; // ~ 15 blocks

        if (nSecondsBehind < UNSYNC_THRESHOLD) {
            is_synchronized = true;
        }

        return {
            top: Blockchain.blockchain.blocks.length,
            is_synchronized: is_synchronized,
            secondsBehind  : nSecondsBehind / 1000
        }

    }

    helloWorld(req, res){
        return {hello: "world" };
    }

    ping(req, res){
        return {ping: "pong"};
    }

}

export default new NodeAPIPublic();
