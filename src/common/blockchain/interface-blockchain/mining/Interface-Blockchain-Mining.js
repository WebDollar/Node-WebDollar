import MiningTransactionsSelector from "./transactions-selector/Mining-Transactions-Selector";
import NodeBlockchainPropagation from "common/sockets/protocol/propagation/Node-Blockchain-Propagation";

const BigInteger = require('big-integer');


import consts from 'consts/const_global';
import global from 'consts/global';

import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'
import Serialization from 'common/utils/Serialization';

import InterfaceBlockchainMiningBasic from "./Interface-Blockchain-Mining-Basic";

import AdvancedMessages from "node/menu/Advanced-Messages";
import StatusEvents from "common/events/Status-Events";

import WebDollarCoins from "common/utils/coins/WebDollar-Coins";
import RevertActions from "common/utils/Revert-Actions/Revert-Actions";

import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'

class InterfaceBlockchainMining extends  InterfaceBlockchainMiningBasic{


    constructor (blockchain, minerAddress, miningFeePerByte){

        super(blockchain, minerAddress, miningFeePerByte);

        this.miningTransactionSelector = new MiningTransactionsSelector(blockchain);

        this.bestHash =   consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BUFFER ;
        this.bestHashNonce = -1;

    }


    //overwrite by Mini-Blockchain Mining
    _simulatedNextBlockMining(nextBlock){

    }

    async getNextBlock(){

        let nextBlock, nextTransactions;

        try {

            nextTransactions = this.miningTransactionSelector.selectNextTransactions(this.miningFeePerByte);

            nextBlock = this.blockchain.blockCreator.createBlockNew(this.unencodedMinerAddress, undefined, nextTransactions );

            nextBlock.difficultyTargetPrev = Buffer.from( this.blockchain.getDifficultyTarget() );
            nextBlock.reward = BlockchainMiningReward.getReward(nextBlock.height);
            nextBlock.updateInterlink();

            for (let i=0; i<nextTransactions.length; i++) {
                if (nextTransactions[i].pendingTransactionsIncluded === undefined) nextTransactions[i].pendingTransactionsIncluded = 0;
                nextTransactions[i].pendingTransactionsIncluded++;
            }

            nextBlock.data.transactions.pendingTransactionsWereIncluded = true;

        } catch (Exception){
            console.error("Error creating next block ", Exception, nextBlock);
        }


        //simulating the new block and calculate the hashAccountantTree
        let revertActions = new RevertActions( this.blockchain );

        try{

            if (await this.blockchain.semaphoreProcessing.processSempahoreCallback(

                async ()=>{

                    return await this.blockchain.simulateNewBlock(nextBlock, true, revertActions,
                        async ()=>{
                            return await this._simulatedNextBlockMining(nextBlock, false);
                        },
                        false); //avoid displaying the changes

                }) === false) throw {message: "Mining1 returned False"};

        } catch (Exception){
            console.error("Error processBlocksSempahoreCallback ", Exception, nextBlock);
            revertActions.revertOperations();
        }

        revertActions.destroyRevertActions();

        return nextBlock;

    }

    /**
     * mine next block
     */
    async mineNextBlock(suspend){

        while (this.started && !global.TERMINATED){

            if (this.minerAddress === undefined){

                AdvancedMessages.alert("Mining suspended. No Mining Address", "Mining Error", "error", 5000);
                this.stopMining();

                return;
            }


            //mining next blocks

            let nextBlock = await this.getNextBlock();

            try {

                let difficulty = this.blockchain.getDifficultyTarget();

                if (difficulty === undefined || difficulty === null)
                    throw {message: 'difficulty not specified'};

                if (difficulty instanceof BigInteger)
                    difficulty = Serialization.serializeToFixedBuffer(consts.BLOCKCHAIN.BLOCKS_POW_LENGTH, Serialization.serializeBigInteger(difficulty));

                if (!Buffer.isBuffer(nextBlock)) {

                    if (nextBlock === undefined || nextBlock === null)
                        throw {message: "block is undefined"};

                    nextBlock._computeBlockHeaderPrefix(); //calculate the Block Header Prefix
                }

                //avoid mining the same nonces on every machine that is mining the same address
                let start = Math.floor( Math.random() * 3700000000 );
                let end = 0xFFFFFFFF;

                await this.mineBlock(nextBlock, difficulty, start, end, nextBlock.height);


            } catch (exception){
                console.log("Mining Exception", exception);
                this.stopMining();
            }


        }

    }

    /**
     * Mine a specific Block
     * @param block
     * @param difficulty
     */
    async mineBlock( block,  difficulty, start, end, height){

        console.log("");
        console.log(" ----------- mineBlock-------------", height);

        try{

            //calculating the hashes per second


            let answer;

            try {
                answer = await this.mine(block, difficulty, start, end, height);
            } catch (exception){
                console.error("Couldn't mine block " + block.height, exception);
                answer.result = false;
            }

            if (answer.result && this.blockchain.blocks.length === block.height ){

                console.warn( "----------------------------------------------------------------------------");
                console.warn( "WebDollar Block was mined ", block.height ," nonce (", answer.nonce+")", answer.hash.toString("hex"), " reward", (block.reward / WebDollarCoins.WEBD), "WEBD", block.data.minerAddress.toString("hex"));
                console.warn( "----------------------------------------------------------------------------");

                //check if I mined all the last K blocks
                let i = this.blockchain.blocks.length-1;
                let count = 0;

                while ( !consts.DEBUG && i >= 0 && this.blockchain.blocks[i].data.minerAddress.equals( this.unencodedMinerAddress ) ){

                    count ++;
                    i--;

                    if (count >= consts.MINING_POOL.MINING.MAXIMUM_BLOCKS_TO_MINE_BEFORE_ERROR){

                        StatusEvents.emit("blockchain/logs", {message: "You mined way too many blocks"});
                        break;
                    }

                }

                let revertActions = new RevertActions(this.blockchain);

                try {

                    if (await this.blockchain.semaphoreProcessing.processSempahoreCallback( async () => {

                            block.hash = answer.hash;
                            block.nonce = answer.nonce;

                            //returning false, because a new fork was changed in the mean while
                            if (this.blockchain.blocks.length !== block.height)
                                return false;

                            return this.blockchain.includeBlockchainBlock( block, false, ["all"], true, revertActions, false );

                        }) === false) throw {message: "Mining2 returned false"};

                    NodeBlockchainPropagation.propagateLastBlockFast( block );

                    //confirming transactions
                    block.data.transactions.confirmTransactions();

                    StatusEvents.emit("blockchain/new-blocks", { });

                } catch (exception){
                    console.error("Mining processBlocksSempahoreCallback raised an error ",block.height, exception);
                    revertActions.revertOperations();
                }
                revertActions.destroyRevertActions();

            } else
            if (!answer.result)
                console.error( "block ", block.height ," was not mined...");

            if (this.reset) { // it was reset
                this.reset = false;
                this._hashesPerSecond = 0;
            }

        } catch (Exception){

            console.error( "Error mining block ", Exception, block.toJSON() );

            throw Exception;
        }

    }

    calculateHash(nonce){
        return this.block.computeHash(nonce);
    }

    async _minePOS(){

        this.end = 0;

        while (this.started && !this.resetForced && !(this.reset && this.useResetConsensus)){

            // try all timestamps
            let medianTimestamp = Math.floor( this.blockchain.blocks.timestampBlocks.getMedianTimestamp(this.block.height, this.block.blockValidation));

            let i = 0;

            try {

                while (this.blockchain.blocks.timestampBlocks.validateNetworkAdjustedTime(medianTimestamp + i) && this.started && !this.resetForced && !(this.reset && this.useResetConsensus)) {

                    this.block.timeStamp = medianTimestamp + i;

                    let answer = await this._mineNonces(0, 0);

                    if (i % 60 === 0) {
                        await this.blockchain.sleep( 5 );
                        console.log(i, answer.hash.toString("hex"));
                    }

                    if (answer.result) {
                        this.block.posSignature = await this.block._signPOSSignature();
                        return answer;
                    }

                    i++;
                }

            } catch (exception){

            }

            //this._hashesPerSecond = 1;
            await this.blockchain.sleep(300);

        }

        return {
            result: false,
            hash: Buffer.from (consts.BLOCKCHAIN.BLOCKS_MAX_TARGET),
            nonce: -1,
        };

    }

    async _mineNonces(start, end){

        let nonce = start;

        if (start < 0 || end < 0 || start > end)
            return {
                result: false,
                hash: new Buffer(consts.BLOCKCHAIN.BLOCKS_MAX_TARGET),
                nonce: -1,
            };

        try {

            while (nonce <= end && this.started && !this.resetForced && !(this.reset && this.useResetConsensus)) {

                let hash = await this.calculateHash(nonce);

                if (hash.compare(this.bestHash) < 0) {

                    this.bestHash = hash;
                    this.bestHashNonce = nonce;

                    if (this.bestHash.compare(this.difficulty) <= 0) {

                        return {
                            result: true,
                            nonce: this.bestHashNonce,
                            hash: this.bestHash,
                        };

                    }

                }

                nonce++;
                this._hashesPerSecond++;
            }


        } catch (exception){
            console.error("Error _mineNonces", "nonce", nonce, start, end );
        }

        return {
            result: false,
            hash: this.bestHash,
            nonce: this.bestHashNonce
        }

    }

    /**
     * Simple Mining with no Workers
     * @param block
     * @param difficulty
     * @returns {Promise.<boolean>}
     */
    async mine(block, difficulty, start, end, height){

        if (start === undefined) start = 0;
        if (end === undefined) end = 0xFFFFFFFF;

        this.block = block;
        this.difficulty = difficulty;

        this.bestHash = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BUFFER;
        this.bestHashNonce = -1;

        try {

            await this._mineNonces(start, end);

        } catch (exception){
            console.log("Error Mining ", exception)
        }

    }



}

export default InterfaceBlockchainMining;