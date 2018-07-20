import StatusEvents from "common/events/Status-Events";
import NodesList from 'node/lists/Nodes-List'
import Blockchain from "main-blockchain/Blockchain"
import Log from 'common/utils/logging/Log';

class PoolNewWorkManagement{

    constructor(poolManagement, poolWorkManagement, blockchain){

        this.poolManagement = poolManagement;
        this.poolWorkManagement = poolWorkManagement;

        this.blockchain = blockchain;

        this._payoutInProgress = false;
        this._payoutInProgressIndex = 0;


        StatusEvents.on("blockchain/new-blocks",async (data)=>{

            if (!this.poolManagement._poolStarted) return;
            if (!Blockchain.synchronized) return;

            this._payoutInProgressIndex++;

            try {
                await this.propagateNewWork(this._payoutInProgressIndex);
            } catch (exception){

            }

        });

    }


    async propagateNewWork(payoutInProgressIndex){

        Log.info("   Connected Miners: "+this.poolManagement.poolData.connectedMinerInstances.list.length, Log.LOG_TYPE.POOLS);

        for (let i=0; i < this.poolManagement.poolData.connectedMinerInstances.list.length; i++ ) {

            this._sendNewWork( this.poolManagement.poolData.connectedMinerInstances.list[i], undefined, payoutInProgressIndex);

        }

    }

    async _sendNewWork( minerInstance, blockInformationMinerInstance, payoutInProgressIndex){

        try{

            if (blockInformationMinerInstance === undefined ) blockInformationMinerInstance = minerInstance.lastBlockInformation;
            if (blockInformationMinerInstance === undefined) return false;

            let prevBlock = blockInformationMinerInstance.workBlock;

            let newWork = await this.poolWorkManagement.getWork( minerInstance, blockInformationMinerInstance );

            if (payoutInProgressIndex !== this._payoutInProgressIndex) return false;

            // i have sent it already in the last - no new work
            if (this.poolWorkManagement.poolWork.lastBlock === prevBlock  ) return true;


            let answer = await minerInstance.socket.node.sendRequestWaitOnce("mining-pool/new-work", {  work: newWork,  } ,"answer", 10000 );

            if ( answer === null ) throw {message: "answer is null"};

            if ( !Buffer.isBuffer(answer.hash ) ) throw {message: "hash is not specified"};
            if ( typeof answer.nonce !== "number" ) throw {message: "nonce is not specified"};


            let processedWork = await this.poolWorkManagement.processWork( minerInstance, answer, prevBlock );

            minerInstance.socket.node.sendRequest("mining-pool/new-work/answer/confirm", {  result: processedWork.result,  reward: processedWork.reward, confirmed: processedWork.confirmed, miner: minerInstance.publicKey,
                h: this.poolManagement.poolStatistics.poolHashes, m: this.poolManagement.poolStatistics.poolMinersOnline.length, b: this.poolManagement.poolStatistics.poolBlocksConfirmed, bp: this.poolManagement.poolStatistics.poolBlocksConfirmedAndPaid, ub: this.poolManagement.poolStatistics.poolBlocksUnconfirmed, bc: this.poolManagement.poolStatistics.poolBlocksBeingConfirmed, t: this.poolManagement.poolStatistics.poolTimeRemaining, n: Blockchain.blockchain.blocks.networkHashRate,
            } ,"answer" );

        } catch (exception){

            if (exception.message !== "answer is null" || Math.random() < 0.2)
                console.error("_sendNewWork", exception);

        }
    }


}

export default PoolNewWorkManagement;