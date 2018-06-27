import BufferExtended from "common/utils/BufferExtended";

const BigNumber = require ('bignumber.js');
import Serialization from 'common/utils/Serialization';
import consts from 'consts/const_global';
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";
import RevertActions from "common/utils/Revert-Actions/Revert-Actions";
import NodeBlockchainPropagation from "common/sockets/protocol/propagation/Node-Blockchain-Propagation";
import PoolWork from "./Pool-Work";
import Utils from "common/utils/helpers/Utils";
import StatusEvents from "common/events/Status-Events";

class PoolWorkManagement{

    constructor(poolManagement, blockchain){

        this.poolManagement = poolManagement;
        this.blockchain = blockchain;

        this.poolWork = new PoolWork(poolManagement, blockchain);
        this.hashBest = Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex");
    }


    async getWork(minerInstance, includeSignature = true, blockInformationMinerInstance){

        let hashes = minerInstance.hashesPerSecond;
        if (hashes === undefined ) hashes = 500;

        if (blockInformationMinerInstance === undefined)
            blockInformationMinerInstance = this.poolManagement.poolData.lastBlockInformation._addBlockInformationMinerInstance(minerInstance);

        await this.poolWork.lastBlockPromise; //it's a promise, let's wait

        if ( this.poolWork.lastBlock === undefined || ( this.poolWork.lastBlockNonce + hashes ) > 0xFFFFFFFF  ||
            (!this.blockchain.semaphoreProcessing.processing && ( this.poolWork.lastBlock.height !==  this.blockchain.blocks.length || !this.poolWork.lastBlock.hashPrev.equals( this.blockchain.blocks.last.hash ))) )
            await this.poolWork.getNextBlockForWork();


        this.poolWork.lastBlockElement.instances[minerInstance.publicKeyString] = this.poolWork.lastBlock;

        let answer = {

            h: this.poolWork.lastBlock.height,
            t: this.poolWork.lastBlock.difficultyTargetPrev,
            s: this.poolWork.lastBlock.computedBlockPrefix,

            start: this.poolWork.lastBlockNonce,
            end: this.poolWork.lastBlockNonce + hashes,

        };

        this.poolWork.lastBlockNonce += hashes;

        blockInformationMinerInstance.workBlock = this.poolWork.lastBlock;

        if (includeSignature) {

            let message = Buffer.concat([this.poolWork.lastBlockSerialization, Serialization.serializeNumber4Bytes(answer.start), Serialization.serializeNumber4Bytes(answer.end)]);
            answer.sig = this.poolManagement.poolSettings.poolDigitalSign(message);

        }

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
                throw {message: "miner instance - no block"};

            let hashesFactor = Math.min(3, (3000/work.timeDiff));
            hashesFactor = Math.max(0.4, hashesFactor);

            minerInstance.hashesPerSecond *= Math.floor( hashesFactor );
            minerInstance.hashesPerSecond = Math.min( minerInstance.hashesPerSecond , 25000);
            minerInstance.hashesPerSecond = Math.max( minerInstance.hashesPerSecond , 100);


            if ( false === await blockInformationMinerInstance.validateWorkHash( work.hash, work.nonce )  )
                throw {message: "block was incorrectly mined", work: work };

            blockInformationMinerInstance.workHash = work.hash;
            blockInformationMinerInstance.workHashNonce = work.nonce;

            if (Math.random() < 0.001)
                console.log("Work: ", work);

            if ( work.result ) {

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

            return {result: true, reward: minerInstance.miner.rewardTotal, confirmed: minerInstance.miner.rewardConfirmedTotal };

        } catch (exception){

            if (exception.message === "block was incorrectly mined" && Math.random() < 0.01 )
                console.error("Pool Work Management raised an error", exception);

            return {result: false, message:exception.message, reward: minerInstance.miner.rewardTotal, confirmed: minerInstance.miner.rewardConfirmedTotal  };

        }

    }

}

export default PoolWorkManagement;