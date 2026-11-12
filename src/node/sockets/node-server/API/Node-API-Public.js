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

    // null = necunoscut (nu „nesincronizat”): consumatorii care citesc booleanul
    // (webd-staking, explorer) trebuie să distingă „fără bloc în memorie” de „în urmă”.
    if ( !lastBlock || typeof lastBlock.timeStamp !== "number" )
        return { is_synchronized: null, secondsBehind: null };

    const blockTimestampMs = (lastBlock.timeStamp + BlockchainGenesis.timeStampOffset) * 1000;
    const behindMs = nowMs - blockTimestampMs;

    return { is_synchronized: behindMs < UNSYNC_THRESHOLD_MS, secondsBehind: behindMs / 1000 };
}

/** Răspunsul rutei `/top`, pur (testabil), fără să crape când lipsește blocul din memorie. */
export function topPayload(blocksLength, lastBlock, nowMs){
    const { is_synchronized, secondsBehind } = syncState( lastBlock, nowMs );
    return { top: blocksLength, is_synchronized: is_synchronized, secondsBehind: secondsBehind };
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
        return topPayload( Blockchain.blockchain.blocks.length, Blockchain.blockchain.blocks.last, new Date().getTime() );
    }

    helloWorld(req, res){
        return {hello: "world" };
    }

    ping(req, res){
        return {ping: "pong"};
    }

}

export default new NodeAPIPublic();
