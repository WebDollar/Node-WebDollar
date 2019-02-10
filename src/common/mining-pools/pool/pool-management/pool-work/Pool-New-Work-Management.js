import StatusEvents from "common/events/Status-Events";
import NodesList from 'node/lists/Nodes-List'
import Blockchain from "main-blockchain/Blockchain"
import Log from 'common/utils/logging/Log';
import consts from 'consts/const_global';

class PoolNewWorkManagement{

    constructor(poolManagement, poolWorkManagement, blockchain){

        this.poolManagement = poolManagement;
        this.poolWorkManagement = poolWorkManagement;

        this.blockchain = blockchain;

        this._workInProgressIndex = 0;

        StatusEvents.on("blockchain/new-blocks",async (data)=>{

            if (!this.poolManagement._poolStarted) return;
            if (!Blockchain.synchronized) return;

            this._workInProgressIndex++;

            try {
                await this.propagateNewWork(this._workInProgressIndex);
            } catch (exception){
                Log.error("propagateNewWork raised a total error", Log.LOG_TYPE.POOLS, exception);
            }

        });

        //start first time
        setTimeout(this.propagateNewWork.bind(this, this._workInProgressIndex), 20000)

    }


    async propagateNewWork(workInProgressIndex){

        Log.info("   Connected Miners: "+this.poolManagement.poolData.connectedMinerInstances.list.length, Log.LOG_TYPE.POOLS);

        let count = 0;
        for (let i=0; i < this.poolManagement.poolData.connectedMinerInstances.list.length; i++ ) {

            if (workInProgressIndex !== this._workInProgressIndex) {
                Log.info("   PROPAGATE NEW WORK returned: " + this._workInProgressIndex +" "+ workInProgressIndex, Log.LOG_TYPE.POOLS);
                return;
            }

            try {
                if (this._sendNewWork(this.poolManagement.poolData.connectedMinerInstances.list[i], undefined, workInProgressIndex) === false) continue;
            } catch (exception){
                Log.error("propagateNewWork raised an error", Log.LOG_TYPE.POOLS, exception);
                continue;
            }

            count ++;

            if (consts.MINING_POOL.CONNECTIONS.PUSH_WORK_MAX_CONNECTIONS_CONSECUTIVE !== 0 && (count % consts.MINING_POOL.CONNECTIONS.PUSH_WORK_MAX_CONNECTIONS_CONSECUTIVE === 0)) await this.blockchain.sleep(10);

        }

        Log.info("   Work sent to " +  count, Log.LOG_TYPE.POOLS);

    }

    async _sendNewWork( minerInstance, blockInformationMinerInstance, workInProgressIndex){

        try{

            if (minerInstance.socket.disconnected)
                return false;

            if ( !blockInformationMinerInstance ) blockInformationMinerInstance = minerInstance.lastBlockInformation;
            if ( !blockInformationMinerInstance ) return false;

            let newWork = await this.poolWorkManagement.getWork( minerInstance, blockInformationMinerInstance );

            if (workInProgressIndex !== this._workInProgressIndex) return false;

            // i have sent it already in the last - no new work
            if (minerInstance.lastWork && newWork.s.equals(minerInstance.lastWork.s) ) return false; //already sent

            minerInstance.socket.node.sendRequest("mining-pool/new-work", {
                work: newWork,
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
            } );

            blockInformationMinerInstance.lastWork = newWork;

            return true;

        } catch (exception){

            if (exception.message !== "answer is null" || Math.random() < 0.2)
                console.error("_sendNewWork", exception);

        }

        return false;
    }


}

export default PoolNewWorkManagement;