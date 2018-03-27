const BigInteger = require('big-integer');

import consts from 'consts/const_global'
import global from 'consts/global'

import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'
import Serialization from 'common/utils/Serialization'

import InterfaceBlockchainMiningBasic from "./Interface-Blockchain-Mining-Basic";



class InterfaceBlockchainMining extends  InterfaceBlockchainMiningBasic{


    constructor (blockchain, minerAddress){
        super(blockchain, minerAddress);
    }



    _selectNextTransactions(){

        let transactions = [], size = consts.SETTINGS.PARAMS.MAX_SIZE.BLOCKS_MAX_SIZE_BYTES - 600;
        let i = this.blockchain.transactions.pendingQueue.list.length-1;

        while (size > 0 && i >= 0){

            let transaction = this.blockchain.transactions.pendingQueue.list[i];

            if ( transaction.validateTransactionEveryTime( ) ){

                size -= transaction.serializeTransaction().length;

                if ( size >= 0 )
                    transactions.push(transaction);

            } else {
                this.blockchain.transactions.pendingQueue.removePendingTransaction(transaction);
            }
            i--;
        }

        return transactions;
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
                alert("Mining suspended. No Mining Address");
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


                nextTransactions = this._selectNextTransactions();
                nextBlock = this.blockchain.blockCreator.createBlockNew(this.unencodedMinerAddress, undefined, nextTransactions );

                nextBlock.difficultyTargetPrev = this.blockchain.getDifficultyTarget();
                nextBlock.reward = BlockchainMiningReward.getReward(nextBlock.height);


            } catch (Exception){
                console.error("Error creating next block ", Exception, nextBlock);
            }

            try{


                //simulating the new block and calculate the hashAccountantTree
                if (await this.blockchain.semaphoreProcessing.processSempahoreCallback(  ()=>{
                        return  this.blockchain.simulateNewBlock(nextBlock, true, ()=>{
                            return this._simulatedNextBlockMining(nextBlock);
                        });
                    }) === false) throw {message: "Mining1 returned False"};


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

        let intervalMiningOutput;

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
                intervalMiningOutput = this.setMiningHashRateInterval();


            let answer;

            try {
                answer = await this.mine(block, difficulty);
            } catch (exception){
                console.error("Couldn't mine block " + block.height, exception);
                answer.result = false;
            }

            if (answer.result && this.blockchain.blocks.length === block.height ){
                console.warn( "WebDollar Block ", block.height ," mined (", answer.nonce+")", answer.hash.toString("hex"), " reward", block.reward, "WEBD", block.data.minerAddress);

                try {

                    if (await this.blockchain.semaphoreProcessing.processSempahoreCallback(() => {
                            block.hash = answer.hash;
                            block.nonce = answer.nonce;

                            //returning false, because a new fork was changed in the mean while
                            if (this.blockchain.blocks.length !== block.height)
                                return false;

                            return this.blockchain.includeBlockchainBlock(block, false, [], true);
                        }) === false) throw {message: "Mining2 returned false"};

                } catch (exception){

                    console.error("Mining processBlocksSempahoreCallback raised an error ",block.height, exception);
                }

            } else
            if (!answer.result)
                console.error( "block ", block.height ," was not mined...");

            if (this.reset) // it was reset
                this.reset = false;

            if ( intervalMiningOutput !== undefined)
                clearInterval(intervalMiningOutput);

        } catch (Exception){

            console.error( "Error mining block ", Exception, block);

            if (intervalMiningOutput !== undefined)
                clearInterval(intervalMiningOutput);
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