import Serialization from 'common/utils/Serialization';
import BufferExtended from "common/utils/BufferExtended";
import consts from 'consts/const_global';
import Blockchain from "main-blockchain/Blockchain";
import WebDollarCoins from "common/utils/coins/WebDollar-Coins";
import RevertActions from "common/utils/Revert-Actions/Revert-Actions";
import NodeBlockchainPropagation from "common/sockets/protocol/propagation/Node-Blockchain-Propagation";

class PoolWorkManagement{

    constructor(poolManagement, blockchain){

        this.poolManagement = poolManagement;
        this.blockchain = blockchain;

        this._lastBlock = undefined;
        this._lastBlockNonce = 0;

    }

    async getNextBlock(){

        if (!Blockchain.synchronized)
            throw {message: "Blockchain is not yet synchronized"};

        this._lastBlock = await this.blockchain.mining.getNextBlock();
        this._lastBlockNonce = 0;

        if (this._lastBlock.computedBlockPrefix === null )
            this._lastBlock._computeBlockHeaderPrefix();

    }


    async getWork(minerInstance){

        let hashes = minerInstance.hashesPerSecond;
        if (hashes === undefined ) hashes = 500;

        if (this._lastBlock === undefined || ( this._lastBlockNonce + hashes ) > 0xFFFFFFFF )
            await this.getNextBlock();

        if ( this._lastBlock.height !==  this.blockchain.blocks.length || !this._lastBlock.hashPrev.equals( this.blockchain.blocks.last.hash ) )
            await this.getNextBlock();

        let serialization = Buffer.concat( [
            Serialization.serializeBufferRemovingLeadingZeros( Serialization.serializeNumber4Bytes(this._lastBlock.height) ),
            Serialization.serializeBufferRemovingLeadingZeros( this._lastBlock.difficultyTargetPrev ),
            this._lastBlock.computedBlockPrefix
        ]);

        let answer = {

            h: this._lastBlock.height,
            t: this._lastBlock.difficultyTargetPrev,
            s: this._lastBlock.computedBlockPrefix,

            start: this._lastBlockNonce,
            end: this._lastBlockNonce + hashes,

            serialization: serialization,
        };

        this._lastBlockNonce += hashes;

        minerInstance.work = answer;

        let blockInformationMinerInstance = this.poolManagement.poolData.lastBlockInformation._addBlockInformationMinerInstance(minerInstance);
        blockInformationMinerInstance.workBlock = this._lastBlock;

        return answer;

    }

    async processWork(minerInstance, work){

        if (work === null || typeof work !== "object") throw {message: "work is undefined"};

        if ( !Buffer.isBuffer(work.hash) || work.hash.length !== consts.BLOCKCHAIN.BLOCKS_POW_LENGTH) throw {message: "hash is invalid"};
        if ( typeof work.nonce !== "number" ) throw {message: "nonce is invalid"};
        if ( typeof work.timeDiff !== "number" ) throw {message: "timeDiff is invalid"};

        let hashesFactor = Math.min(5, (3000/work.timeDiff));
        hashesFactor = Math.max(0.01, hashesFactor);

        minerInstance.hashesPerSecond *= Math.floor( hashesFactor );
        minerInstance.hashesPerSecond = Math.min( minerInstance.hashesPerSecond , 5000);
        minerInstance.hashesPerSecond = Math.max( minerInstance.hashesPerSecond , 100);



        let blockInformationMinerInstance = this.poolManagement.poolData.lastBlockInformation._addBlockInformationMinerInstance(minerInstance);

        if ( await blockInformationMinerInstance.validateWorkHash( work.hash, work.nonce ) ){

            blockInformationMinerInstance.workHash = work.hash;
            blockInformationMinerInstance.workHashNonce = work.nonce;

            blockInformationMinerInstance.calculateDifficulty();
            blockInformationMinerInstance.adjustDifficulty(blockInformationMinerInstance.workDifficulty);

            //statistics
            this.poolManagement.poolStatistics.addStatistics(blockInformationMinerInstance.workDifficulty, minerInstance.publicKey, minerInstance);

            if (work.result)
                if (await blockInformationMinerInstance.wasBlockMined() ) {

                    console.warn("----------------------------------------------------------------------------");
                    console.warn("WebDollar Block was mined in Pool ", blockInformationMinerInstance.workBlock.height, " nonce (", blockInformationMinerInstance.workHashNonce + ")", blockInformationMinerInstance.workHash.toString("hex"), " reward", (blockInformationMinerInstance.workBlock.reward / WebDollarCoins.WEBD), "WEBD", blockInformationMinerInstance.workBlock.data.minerAddress.toString("hex"));
                    console.warn("----------------------------------------------------------------------------");


                    try {

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

                    } catch (exception) {

                        console.error("Mining processBlocksSempahoreCallback raised an error ", blockInformationMinerInstance.workBlock.height, exception);

                    }

                } else {
                    //remove blockInformation
                    this.poolManagement.poolData.lastBlockInformation._deleteBLockInformationMinerInstance(minerInstance);
                    throw {message: "block was incorrectly mined"};
                }

            return {result: true, potentialReward: blockInformationMinerInstance.reward, confirmedReward: minerInstance.miner.calculateConfirmedReward() };

        } else {

            //remove blockInformation
            this.poolManagement.poolData.lastBlockInformation._deleteBLockInformationMinerInstance(minerInstance);

        }

        return {result: false, potentialReward: 0 };

    }

}

export default PoolWorkManagement;