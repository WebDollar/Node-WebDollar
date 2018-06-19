import Serialization from 'common/utils/Serialization';
import BufferExtended from "common/utils/BufferExtended";
import consts from 'consts/const_global';
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";
import RevertActions from "common/utils/Revert-Actions/Revert-Actions";
import NodeBlockchainPropagation from "common/sockets/protocol/propagation/Node-Blockchain-Propagation";
import PoolWork from "./Pool-Work";

class PoolWorkManagement{

    constructor(poolManagement, blockchain){

        this.poolManagement = poolManagement;
        this.blockchain = blockchain;

        this.poolWork = new PoolWork(poolManagement, blockchain);

    }




    async getWork(minerInstance){

        let hashes = minerInstance.hashesPerSecond;
        if (hashes === undefined ) hashes = 500;

        let blockInformationMinerInstance = this.poolManagement.poolData.lastBlockInformation._addBlockInformationMinerInstance(minerInstance);

        console.log(11111);

        await this.poolWork.lastBlockPromise; //it's a promise, let's wait

        if (this.poolWork.lastBlock === undefined || ( this.poolWork.lastBlockNonce + hashes ) > 0xFFFFFFFF  || this.poolWork.lastBlock.height !==  this.blockchain.blocks.length || !this.poolWork.lastBlock.hashPrev.equals( this.blockchain.blocks.last.hash ))
            await this.poolWork.getNextBlockForWork();

        console.log(33333);

        let serialization = Buffer.concat( [
            Serialization.serializeBufferRemovingLeadingZeros( Serialization.serializeNumber4Bytes(this.poolWork.lastBlock.height) ),
            Serialization.serializeBufferRemovingLeadingZeros( this.poolWork.lastBlock.difficultyTargetPrev ),
            this.poolWork.lastBlock.computedBlockPrefix
        ]);

        let answer = {

            h: this.poolWork.lastBlock.height,
            t: this.poolWork.lastBlock.difficultyTargetPrev,
            s: this.poolWork.lastBlock.computedBlockPrefix,

            start: this.poolWork.lastBlockNonce,
            end: this.poolWork.lastBlockNonce + hashes,

            serialization: serialization,
        };

        this.poolWork.lastBlockNonce += hashes;

        minerInstance.work = answer;
        blockInformationMinerInstance.workBlock = this.poolWork.lastBlock;

        return answer;

    }

    async processWork(minerInstance, work){

        try{

            if (work === null || typeof work !== "object") throw {message: "work is undefined"};

            if ( !Buffer.isBuffer(work.hash) || work.hash.length !== consts.BLOCKCHAIN.BLOCKS_POW_LENGTH) throw {message: "hash is invalid"};
            if ( typeof work.nonce !== "number" ) throw {message: "nonce is invalid"};
            if ( typeof work.timeDiff !== "number" ) throw {message: "timeDiff is invalid"};

            let blockInformationMinerInstance = this.poolManagement.poolData.lastBlockInformation._addBlockInformationMinerInstance(minerInstance);

            if (blockInformationMinerInstance.workBlock === undefined)
                throw {message: "no block"};

            let hashesFactor = Math.min(5, (3000/work.timeDiff));
            hashesFactor = Math.max(0.01, hashesFactor);

            minerInstance.hashesPerSecond *= Math.floor( hashesFactor );
            minerInstance.hashesPerSecond = Math.min( minerInstance.hashesPerSecond , 5000);
            minerInstance.hashesPerSecond = Math.max( minerInstance.hashesPerSecond , 100);


            if ( false === await blockInformationMinerInstance.validateWorkHash( work.hash, work.nonce )  )
                throw {message: "block was incorrectly mined"};

            blockInformationMinerInstance.workHash = work.hash;
            blockInformationMinerInstance.workHashNonce = work.nonce;

            blockInformationMinerInstance.calculateDifficulty();
            blockInformationMinerInstance.adjustDifficulty(blockInformationMinerInstance.workDifficulty);

            //statistics
            this.poolManagement.poolStatistics.addStatistics(blockInformationMinerInstance.workDifficulty, minerInstance.publicKey, minerInstance);

            if (work.result && await blockInformationMinerInstance.wasBlockMined() ) {

                console.warn("----------------------------------------------------------------------------");
                console.warn("WebDollar Block was mined in Pool ", blockInformationMinerInstance.workBlock.height, " nonce (", blockInformationMinerInstance.workHashNonce + ")", blockInformationMinerInstance.workHash.toString("hex"), " reward", (blockInformationMinerInstance.workBlock.reward / WebDollarCoins.WEBD), "WEBD", blockInformationMinerInstance.workBlock.data.minerAddress.toString("hex"));
                console.warn("----------------------------------------------------------------------------");

                let revertActions = new RevertActions(this.blockchain);

                if (await this.blockchain.semaphoreProcessing.processSempahoreCallback(async () => {

                        blockInformationMinerInstance.workBlock.hash = blockInformationMinerInstance.workHash;
                        blockInformationMinerInstance.workBlock.nonce = blockInformationMinerInstance.workHashNonce;

                        //returning false, because a new fork was changed in the mean while
                        if (this.blockchain.blocks.length !== blockInformationMinerInstance.workBlock.height)
                            return false;

                        return this.blockchain.includeBlockchainBlock(blockInformationMinerInstance.workBlock, false, ["all"], true, revertActions);

                    }) === false) throw {message: "Mining2 returned false"};

                NodeBlockchainPropagation.propagateLastBlockFast(blockInformationMinerInstance.workBlock);

                revertActions.destroyRevertActions();

                //confirming transactions
                blockInformationMinerInstance.workBlock.data.transactions.transactions.forEach((transaction) => {
                    transaction.confirmed = true;
                    this.blockchain.transactions.pendingQueue._removePendingTransaction(transaction);
                });
            }

            return {result: true, potentialReward: blockInformationMinerInstance.reward, confirmedReward: minerInstance.miner.calculateConfirmedReward() };

        } catch (exception){

            return {result: false, potentialReward: 0, message: exception.message };

        }

    }

}

export default PoolWorkManagement;