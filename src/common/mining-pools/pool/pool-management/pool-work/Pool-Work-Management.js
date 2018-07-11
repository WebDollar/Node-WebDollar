import BufferExtended from "common/utils/BufferExtended";

import Serialization from 'common/utils/Serialization';
import consts from 'consts/const_global';
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";
import RevertActions from "common/utils/Revert-Actions/Revert-Actions";
import NodeBlockchainPropagation from "common/sockets/protocol/propagation/Node-Blockchain-Propagation";
import PoolWork from "./Pool-Work";
import StatusEvents from "common/events/Status-Events";
import PoolNewWorkManagement from "./Pool-New-Work-Management"

class PoolWorkManagement{

    constructor(poolManagement, blockchain){

        this.poolManagement = poolManagement;
        this.blockchain = blockchain;

        this.poolNewWorkManagement = new PoolNewWorkManagement(poolManagement, this, blockchain);

        this.poolWork = new PoolWork(poolManagement, blockchain);
    }


    async getWork(minerInstance,  blockInformationMinerInstance){

        if (minerInstance === undefined) throw {message: "minerInstance is undefined"};

        let hashes = minerInstance.hashesPerSecond;
        if (hashes === undefined ) hashes = 500;

        if (blockInformationMinerInstance === undefined)
            blockInformationMinerInstance = this.poolManagement.poolData.lastBlockInformation._addBlockInformationMinerInstance(minerInstance);

        await this.poolWork.lastBlockPromise; //it's a promise, let's wait

        if ( this.poolWork.lastBlock === undefined || ( this.poolWork.lastBlockNonce + hashes ) > 0xFFFFFFFF  ||
            (!this.blockchain.semaphoreProcessing.processing && ( this.poolWork.lastBlock.height !==  this.blockchain.blocks.length || !this.poolWork.lastBlock.hashPrev.equals( this.blockchain.blocks.last.hash ))) )
            await this.poolWork.getNextBlockForWork();


        this.poolWork.lastBlockElement.instances[minerInstance.socket.node.sckAddress.uuid] = this.poolWork.lastBlock;

        let answer = {

            h: this.poolWork.lastBlock.height,
            t: this.poolWork.lastBlock.difficultyTargetPrev,
            s: this.poolWork.lastBlock.computedBlockPrefix,

            start: this.poolWork.lastBlockNonce,
            end: this.poolWork.lastBlockNonce + hashes,

        };

        minerInstance.lastBlockInformation =  blockInformationMinerInstance;
        minerInstance.workBlock =  this.poolWork.lastBlock;
        minerInstance.miner.dateActivity = new Date().getTime();

        this.poolWork.lastBlockNonce += hashes;

        blockInformationMinerInstance.workBlock = this.poolWork.lastBlock;

        if (this.poolManagement.poolSettings.poolUseSignatures) {

            let message = Buffer.concat([this.poolWork.lastBlockSerialization, Serialization.serializeNumber4Bytes(answer.start), Serialization.serializeNumber4Bytes(answer.end)]);
            answer.sig = this.poolManagement.poolSettings.poolDigitalSign(message);

        }

        return answer;

    }

    async processWork(minerInstance, work, prevBlock){

        let result = false;

        try{

            if (minerInstance === undefined) throw {message: "minerInstance is undefined"};
            if (work === null || typeof work !== "object") throw {message: "work is undefined"};

            if ( !Buffer.isBuffer(work.hash) || work.hash.length !== consts.BLOCKCHAIN.BLOCKS_POW_LENGTH) throw {message: "hash is invalid"};
            if ( typeof work.nonce !== "number" ) throw {message: "nonce is invalid"};

            let blockInformationMinerInstance = this.poolManagement.poolData.lastBlockInformation._addBlockInformationMinerInstance(minerInstance);

            if ( (prevBlock  || blockInformationMinerInstance.workBlock) === undefined)
                throw {message: "miner instance - no block"};

            if (work.timeDiff !== undefined) {
                if (typeof work.timeDiff !== "number") throw {message: "timeDiff is invalid"};

                let hashesFactor = Math.min(10, ( 80000 / work.timeDiff )); //80 sec
                hashesFactor = Math.max(0.2, hashesFactor);

                let hashesPerSecond = Math.floor( minerInstance.hashesPerSecond * hashesFactor);
                minerInstance.hashesPerSecond = Math.max( 100, Math.min( hashesPerSecond, 400000 ));

            }


            if ( false === await blockInformationMinerInstance.validateWorkHash( work.hash, work.nonce, prevBlock )  )
                throw {message: "block was incorrectly mined", work: work };

            blockInformationMinerInstance.workHash = work.hash;
            blockInformationMinerInstance.workHashNonce = work.nonce;

            if (Math.random() < 0.001)
                console.log("Work: ", work);

            if ( work.result && prevBlock === undefined ) { //it is a solution and prevBlock is undefined

                console.warn("----------------------------------------------------------------------------");
                console.warn("----------------------------------------------------------------------------");
                console.warn("WebDollar Block was mined in Pool 1 ", work.hash.toString("hex"), "nonce", work.nonce );
                console.warn("----------------------------------------------------------------------------");
                console.warn("----------------------------------------------------------------------------");

                if ( await blockInformationMinerInstance.wasBlockMined() ){

                    console.warn("----------------------------------------------------------------------------");
                    console.warn("----------------------------------------------------------------------------");
                    console.warn("WebDollar Block was mined in Pool 2 ", blockInformationMinerInstance.workBlock.height, " nonce (", blockInformationMinerInstance.workHashNonce + ")", blockInformationMinerInstance.workHash.toString("hex"), " reward", (blockInformationMinerInstance.workBlock.reward / WebDollarCoins.WEBD), "WEBD", blockInformationMinerInstance.workBlock.data.minerAddress.toString("hex"));
                    console.warn("----------------------------------------------------------------------------");
                    console.warn("----------------------------------------------------------------------------");


                    //returning false, because a new fork was changed in the mean while
                    if (this.blockchain.blocks.length !== blockInformationMinerInstance.workBlock.height)
                        throw {message: "pool: block is already too old"};

                    let revertActions = new RevertActions(this.blockchain);

                    try {

                        if (await this.blockchain.semaphoreProcessing.processSempahoreCallback(async () => {

                                //returning false, because a new fork was changed in the mean while
                                if (this.blockchain.blocks.length !== blockInformationMinerInstance.workBlock.height)
                                    throw {message: "pool: block is already too old for processing"};

                                blockInformationMinerInstance.workBlock.hash = blockInformationMinerInstance.workHash;
                                blockInformationMinerInstance.workBlock.nonce = blockInformationMinerInstance.workHashNonce;

                                return this.blockchain.includeBlockchainBlock(blockInformationMinerInstance.workBlock, false, ["all"], true, revertActions);

                            }) === false) throw {message: "Mining2 returned false"};

                        NodeBlockchainPropagation.propagateLastBlockFast(blockInformationMinerInstance.workBlock);

                        //confirming transactions
                        blockInformationMinerInstance.workBlock.data.transactions.confirmTransactions();


                        blockInformationMinerInstance.blockInformation.block = blockInformationMinerInstance.workBlock;
                        this.poolManagement.poolData.addBlockInformation();


                        blockInformationMinerInstance.poolWork = Buffer.from("00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF","hex");
                        blockInformationMinerInstance.poolWorkNonce = -1;

                        StatusEvents.emit("blockchain/new-blocks", { });

                    } catch (exception){

                        console.error("PoolWork include raised an exception", exception);
                        revertActions.revertOperations();

                        this.poolWork.getNextBlockForWork();
                    }

                    revertActions.destroyRevertActions();

                }


            }

            blockInformationMinerInstance.calculateDifficulty();
            blockInformationMinerInstance.adjustDifficulty(undefined, true);

            //statistics
            this.poolManagement.poolStatistics.addStatistics(blockInformationMinerInstance._workDifficulty, minerInstance);

            result = true;

        } catch (exception){

            if (exception.message === "block was incorrectly mined" && Math.random() < 0.01 )
                console.error("Pool Work Management raised an error", exception);

        }

        return {result: result, reward: minerInstance.miner.rewardTotal, confirmed: minerInstance.miner.rewardConfirmedTotal, refReward: minerInstance.miner.referrals.rewardReferralsTotal, refConfirmed: minerInstance.miner.referrals.rewardReferralsConfirmed  }

    }

}

export default PoolWorkManagement;