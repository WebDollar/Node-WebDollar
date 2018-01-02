var BigInteger = require('big-integer');
const colors = require('colors/safe');
const EventEmitter = require('events');

import consts from 'consts/const_global'

import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'
import Serialization from 'common/utils/Serialization'



class InterfaceBlockchainMining{


    constructor (blockchain, minerAddress){

        this.emitter = new EventEmitter();

        this.blockchain = blockchain;

        this.minerAddress = minerAddress;

        this._nonce = 0;
        this.started = false;
        this.hashesPerSecond = 0;
    }

    async startMining(){

        this.emitter.emit('mining/status-changed', true);

        this.started = true;
        this.reset = false;

        await this.mineNextBlock(true);
    }

    stopMining(){

        this.emitter.emit('mining/status-changed', false);
        this.started = false;

    }

    resetMining(){
        this.reset = true;
        this.emitter.emit('mining/reset', true);
    }

    selectNextTransactions(){
        return []
    }

    _simulatedNextBlockMining(nextBlock){

    }

    /**
     * mine next block
     */
    async mineNextBlock(showMiningOutput){

        while (this.started){
            //mining next blocks

            let nextBlock, nextTransactions;

            try {

                nextTransactions = this.selectNextTransactions();
                nextBlock = this.blockchain.blockCreator.createBlockNew(this.minerAddress, nextTransactions );

                nextBlock.reward = BlockchainMiningReward.getReward(nextBlock.height);

                //simulating the new block and calculate the hashAccountantTree
                await this.blockchain.processBlocksSempahoreCallback( ()=>{
                    this.blockchain.simulateNewBlock(nextBlock, true, ()=>{
                        this._simulatedNextBlockMining(nextBlock);
                    });
                });

            } catch (Exception){
                console.log(colors.red("Error creating next block "+Exception.toString()), Exception, nextBlock);
            }

            try {
                await this.mineBlock(nextBlock, this.blockchain.getDifficultyTarget(), undefined, showMiningOutput);
            } catch (exception){
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

        try{

            if (difficulty === undefined || difficulty === null) throw 'difficulty not specified';

            if (difficulty instanceof BigInteger)
                difficulty = Serialization.serializeToFixedBuffer(consts.BLOCKS_POW_LENGTH, Serialization.serializeBigInteger(difficulty));

            if (block === undefined || block === null) throw "block is undefined";

            block._computeBlockHeaderPrefix(); //calculate the Block Header Prefix

            this._nonce = initialNonce||0;
            let  solutionFound = false;

            if (typeof this._nonce !== 'number') return 'initial nonce is not a number';

            //calculating the hashes per second
            let intervalMiningOutput;
            if (showMiningOutput)
                intervalMiningOutput = this.setMiningHashRateInterval();


            while (this._nonce <= 0xFFFFFFFF && this.started && !this.reset ){

                let hash = await block.computeHash(this._nonce);

                console.log('Mining WebDollar Argon2 - this._nonce', this._nonce, hash.toString("hex") );


                if ( hash.compare(difficulty) <= 0 ) {

                    console.log( colors.green("WebDollar Block ", block.height ," mined ", this._nonce, hash.toString("hex"), " reward", block.reward, "WEBD") );

                    block.hash = hash;
                    block.nonce = this._nonce;

                    await this.blockchain.processBlocksSempahoreCallback( ()=>{
                        return this.blockchain.includeBlockchainBlock( block );
                    });

                    solutionFound = true;

                    break;
                }

                this._nonce++;
            }

            if (!solutionFound)
                console.log( colors.red("block ", block.height ," was not mined...") );

            if (this.reset) // it was reset
                this.reset = false;

            if ( intervalMiningOutput !== undefined)
                clearInterval(intervalMiningOutput);

        } catch (Exception){

            console.log(colors.red("Error mining block "), Exception, block);
            throw Exception;

        }

    }


    setMiningHashRateInterval(){
        let previousNonce = this._nonce;

        return setInterval(() => {
            this.hashesPerSecond = previousNonce - this._nonce;
            this.emitter.emit("mining/hash-rate", this.hashesPerSecond );
            console.log( this.hashesPerSecond.toString() + " hashes/s");
        }, 1000);
    }


}

export default InterfaceBlockchainMining;