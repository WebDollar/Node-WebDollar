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
import RevertActions from "../../../utils/Revert-Actions/Revert-Actions";

class InterfaceBlockchainMining extends  InterfaceBlockchainMiningBasic{


    constructor (blockchain, minerAddress, miningFeeThreshold){

        super(blockchain, minerAddress, miningFeeThreshold);

        this.miningTransactionSelector = new MiningTransactionsSelector(blockchain);
    }


    //overwrite by Mini-Blockchain Mining
    _simulatedNextBlockMining(nextBlock){
    }

    /**
     * mine next block
     */
    async mineNextBlock(showMiningOutput, suspend){

        while (this.started && !global.TERMINATED){

            if (this.minerAddress === undefined){

                AdvancedMessages.alert("Mining suspended. No Mining Address");
                this.stopMining();

                return;
            }

            //mining next blocks

            // LIMIT mining first 21 blocks
            // if (this.blockchain.blocks.length === 11 && suspend === false) {
            //     setTimeout( async ()=>{await this.mineNextBlock(showMiningOutput, true)}, 10000);
            //     return;
            // }
            // if (this.blockchain.blocks.length === 12)
            //     return;

            let nextBlock, nextTransactions;

            try {

                nextTransactions = this.miningTransactionSelector.selectNextTransactions(this.miningFeeThreshold);

                nextBlock = this.blockchain.blockCreator.createBlockNew(this.unencodedMinerAddress, undefined, nextTransactions );

                nextBlock.difficultyTargetPrev = this.blockchain.getDifficultyTarget();
                nextBlock.reward = BlockchainMiningReward.getReward(nextBlock.height);
                nextBlock.updateInterlink();


            } catch (Exception){
                console.error("Error creating next block ", Exception, nextBlock);
            }

            try{


                //simulating the new block and calculate the hashAccountantTree
                let revertActions = new RevertActions( this.blockchain );

                if (await this.blockchain.semaphoreProcessing.processSempahoreCallback(

                    async ()=>{

                        return await this.blockchain.simulateNewBlock(nextBlock, true, revertActions,
                            async ()=>{
                                return await this._simulatedNextBlockMining(nextBlock, false);
                            },
                            false); //avoid displaying the changes

                    }) === false) throw {message: "Mining1 returned False"};

                revertActions.destroyRevertActions();

            } catch (Exception){
                console.error("Error processBlocksSempahoreCallback ", Exception, nextBlock);
            }

            try {
                await this.mineBlock(nextBlock, this.blockchain.getDifficultyTarget(), undefined, showMiningOutput);
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
     * @param initialNonce
     */
    async mineBlock( block,  difficulty, initialNonce, showMiningOutput ){

        console.log("");
        console.log(" ----------- mineBlock-------------");

        try{
            console.log("difficultydifficultydifficulty", difficulty === undefined || difficulty === null);

            if (difficulty === undefined || difficulty === null)
                throw {message: 'difficulty not specified'};

            if (difficulty instanceof BigInteger)
                difficulty = Serialization.serializeToFixedBuffer(consts.BLOCKCHAIN.BLOCKS_POW_LENGTH, Serialization.serializeBigInteger(difficulty));

            if (block === undefined || block === null)
                throw {message: "block is undefined"};

            block._computeBlockHeaderPrefix(); //calculate the Block Header Prefix

            this._nonce = initialNonce||0;

            if (typeof this._nonce !== 'number')
                return 'initial nonce is not a number';

            //calculating the hashes per second

            if (showMiningOutput)
                this.setMiningHashRateInterval();


            let answer;

            try {
                answer = await this.mine(block, difficulty);
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

                try {

                    let revertActions = new RevertActions(this.blockchain);

                    if (await this.blockchain.semaphoreProcessing.processSempahoreCallback( async () => {

                            block.hash = answer.hash;
                            block.nonce = answer.nonce;

                            //returning false, because a new fork was changed in the mean while
                            if (this.blockchain.blocks.length !== block.height)
                                return false;

                            return this.blockchain.includeBlockchainBlock( block, false, ["all"], true, revertActions );

                        }) === false) throw {message: "Mining2 returned false"};

                    NodeBlockchainPropagation.propagateLastBlockFast( block );

                    revertActions.destroyRevertActions();

                    //confirming transactions
                    block.data.transactions.transactions.forEach((transaction) => {
                        transaction.confirmed = true;

                        this.blockchain.transactions.pendingQueue._removePendingTransaction(transaction);
                    });

                } catch (exception){

                    console.error("Mining processBlocksSempahoreCallback raised an error ",block.height, exception);
                }

            } else
            if (!answer.result)
                console.error( "block ", block.height ," was not mined...");

            if (this.reset) { // it was reset
                this.reset = false;
                this._hashesPerSecond = 0;
            }

            this._destroyMiningInterval();

        } catch (Exception){

            console.error( "Error mining block ", Exception, block);
            this._destroyMiningInterval();

            throw Exception;
        }

    }


    /**
     * Simple Mining with no Workers
     * @param block
     * @param difficulty
     * @returns {Promise.<boolean>}
     */
    mine(block, difficulty){

        return new Promise( async(resolve)=>{

            try {
                while (this._nonce <= 0xFFFFFFFF && this.started && !this.reset) {

                    let hash = await block.computeHash(this._nonce);

                    //console.log('Mining WebDollar Argon2 - this._nonce', this._nonce, hash.toString("hex") );


                    if (hash.compare(difficulty) <= 0) {

                        resolve({
                            result: true,
                            nonce: this._nonce,
                            hash: hash,
                        });

                        return;

                    }

                    this._nonce++;
                    this._hashesPerSecond++;
                }
            } catch (exception){
                console.log("Error Mining ", exception)
            }

            resolve ({result:false});

        })



    }



}

export default InterfaceBlockchainMining;