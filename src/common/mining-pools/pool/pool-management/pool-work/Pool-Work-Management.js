import BufferExtended from "common/utils/BufferExtended";

import Serialization from 'common/utils/Serialization';
import consts from 'consts/const_global';
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";
import RevertActions from "common/utils/Revert-Actions/Revert-Actions";
import NodeBlockchainPropagation from "common/sockets/protocol/propagation/Node-Blockchain-Propagation";
import PoolWork from "./Pool-Work";
import StatusEvents from "common/events/Status-Events";
import PoolNewWorkManagement from "./Pool-New-Work-Management"
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis';

import PoolWorkValidation from "./Pool-Work-Validation";

class PoolWorkManagement{

    constructor(poolManagement, blockchain){

        this.poolManagement = poolManagement;
        this.blockchain = blockchain;

        this.poolNewWorkManagement = new PoolNewWorkManagement(poolManagement, this, blockchain);
        this.poolWorkValidation = new PoolWorkValidation(poolManagement, this);

        this.poolWork = new PoolWork(poolManagement, blockchain);
    }

    startPoolWorkManagement(){
        this.poolWork.startGarbageCollector();
        this.poolWorkValidation.startPoolWorkValidation();
    }

    stopPoolWorkManagement(){
        this.poolWorkValidation.stopPoolWorkValidation();
        this.poolWork.stopGarbageCollector();
    }


    async getWork(minerInstance,  blockInformationMinerInstance){

        if (minerInstance === undefined) throw {message: "minerInstance is undefined"};

        let hashes = minerInstance.hashesPerSecond;
        if (hashes === undefined ) hashes = 500;

        if (blockInformationMinerInstance === undefined)
            blockInformationMinerInstance = this.poolManagement.poolData.lastBlockInformation._addBlockInformationMinerInstance(minerInstance);

        await this.poolWork.lastBlockPromise; //it's a promise, let's wait

        if ( this.poolWork.lastBlock === undefined || ( this.poolWork.lastBlockNonce + hashes ) > 0xFFFFFFFF  || ( this.poolWork.lastBlock.timeStamp + BlockchainGenesis.timeStampOffset < (new Date().getTime()/1000 - 300) ) ||
            (!this.blockchain.semaphoreProcessing.processing && ( this.poolWork.lastBlock.height !==  this.blockchain.blocks.length || !this.poolWork.lastBlock.hashPrev.equals( this.blockchain.blocks.last.hash ))) )
            await this.poolWork.getNextBlockForWork();


        this.poolWork.lastBlockElement.instances[minerInstance.socket.node.sckAddress.uuid] = this.poolWork.lastBlock;

        let answer = {

            h: this.poolWork.lastBlock.height,
            t: this.poolWork.lastBlock.difficultyTargetPrev,
            s: this.poolWork.lastBlock.computedBlockPrefix,
            I: this.poolWork.lastBlockId,

            start: this.poolWork.lastBlockNonce,
            end: this.poolWork.lastBlockNonce + hashes,

        };

        this.poolWork.lastBlockNonce += hashes;

        minerInstance.lastBlockInformation =  blockInformationMinerInstance;
        minerInstance.workBlock =  this.poolWork.lastBlock;
        minerInstance.dateActivity = new Date().getTime()/1000;

        blockInformationMinerInstance.workBlock = this.poolWork.lastBlock;

        if (this.poolManagement.poolSettings.poolUseSignatures) {

            let message = Buffer.concat( [ this.poolWork.lastBlockSerialization, Serialization.serializeNumber4Bytes(answer.start), Serialization.serializeNumber4Bytes(answer.end) ]);
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


            if ( false === await blockInformationMinerInstance.validateWorkHash( work.hash, work.nonce, prevBlock )  )
                throw {message: "block was incorrectly mined", work: work };

            blockInformationMinerInstance.workHash = work.hash;
            blockInformationMinerInstance.workHashNonce = work.nonce;

            if (Math.random() < 0.001)
                console.log("Work: ", work);

            if ( work.result  ) { //it is a solution and prevBlock is undefined

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

                    let block;
                    try {

                        blockInformationMinerInstance.workBlock.hash = blockInformationMinerInstance.workHash;
                        blockInformationMinerInstance.workBlock.nonce = blockInformationMinerInstance.workHashNonce;

                        let workBlock = blockInformationMinerInstance.workBlock;

                        let serialization = blockInformationMinerInstance.workBlock.serializeBlock();
                        block = this.blockchain.blockCreator.createEmptyBlock(workBlock.height, undefined );
                        block.deserializeBlock(serialization, workBlock.height, workBlock.reward,  );

                        let blockInformation = blockInformationMinerInstance.blockInformation;

                        if (await this.blockchain.semaphoreProcessing.processSempahoreCallback(async () => {

                                //returning false, because a new fork was changed in the mean while
                                if (this.blockchain.blocks.length !== block.height)
                                    throw {message: "pool: block is already too old for processing"};

                                return this.blockchain.includeBlockchainBlock(block, false, ["all"], true, revertActions);

                            }) === false) throw {message: "Mining2 returned false"};

                        NodeBlockchainPropagation.propagateLastBlockFast(block);

                        //confirming transactions
                        block.data.transactions.confirmTransactions();


                        try {
                            blockInformation.block = workBlock;
                        } catch (exception){
                            console.error("blockInformation block", exception);
                        }

                        this.poolManagement.poolData.addBlockInformation();


                        blockInformationMinerInstance.poolWork = Buffer.from("00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF","hex");
                        blockInformationMinerInstance.poolWorkNonce = -1;

                        StatusEvents.emit("blockchain/new-blocks", { });

                    } catch (exception){

                        console.error("PoolWork include raised an exception", exception);
                        revertActions.revertOperations();

                        if (block !== undefined)
                            block.destroyBlock();

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

            if (exception.message === "block was incorrectly mined" && Math.random() < 0.3 )
                console.error("Pool Work Management raised an error", exception);

        }

        return {result: result, reward: minerInstance.miner.rewardTotal, confirmed: minerInstance.miner.rewardConfirmedTotal, refReward: minerInstance.miner.referrals.rewardReferralsTotal, refConfirmed: minerInstance.miner.referrals.rewardReferralsConfirmed  }

    }

}

export default PoolWorkManagement;