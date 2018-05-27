import consts from 'consts/const_global';
import Convert from 'common/utils/Convert';
import NodesList from 'node/lists/Nodes-List';
import PoolData from 'common/mining-pools/pool-management/Pool-Data';
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';
import  Utils from "common/utils/helpers/Utils"
import PoolManagement from "../pool-management/Pool-Settings";

/*
 * Miners earn shares until the pool finds a block (the end of the mining round).
 * After that each user gets reward R = B * n / N,
 * where n is amount of his own shares,
 * and N is amount of all shares in this round. 
 * In other words, all shares are equal, but its cost is calculated only in the end of a round.
 */
class PoolLeaderProtocol {

    constructor(databaseName = consts.DATABASE_NAMES.POOL_DATABASE) {


        NodesList.emitter.on("nodes-list/connected", (result) => {
            this._subscribeMiner(result)
        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeMiner(result)
        });


    }

    _subscribeMiner(nodesListObject) {

        let socket = nodesListObject.socket;


        socket.node.on("mining-pool/hello-pool", (data) => {

            try{

            } catch (exception){

            }

        });

        socket.node.on("mining-pool/change-wallet", (data) => {

            try{

            } catch (exception){

            }

        });

        socket.node.on("mining-pool/request-reward", (data) => {

            try{

            } catch (exception){

            }

        });

        socket.node.on("mining-pool/get-miner-work", (data) => {

            try{

            } catch (exception){

            }

        });

    }

    _unsubscribeMiner(nodesListObject) {

        let socket = nodesListObject.socket;
    }



}

export default PoolLeaderProtocol;