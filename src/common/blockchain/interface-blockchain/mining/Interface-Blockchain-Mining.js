import BufferExtended from "../../../utils/BufferExtended";

var BigInteger = require('big-integer');
const colors = require('colors/safe');
const EventEmitter = require('events');

import consts from 'consts/const_global'
import global from 'consts/global'

import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'
import Serialization from 'common/utils/Serialization'



class InterfaceBlockchainMining{


    constructor (blockchain, minerAddress){

        this.emitter = new EventEmitter();

        this.blockchain = blockchain;

        this.minerAddressBase = '';
        this.minerAddress = undefined;

        this.setMinerAddress(minerAddress);

        this._nonce = 0;
        this.started = false;
        this._hashesPerSecond = 0;

    }


    async startMining(){

        this.started = true;
        this.reset = false;

        this.emitter.emit('mining/status-changed', true);

        await this.mineNextBlock(true);
    }

    stopMining(){

        this.started = false;
        this.emitter.emit('mining/status-changed', false);
    }

    resetMining(){
        this.reset = true;
        this.emitter.emit('mining/reset', true);
    }

    _selectNextTransactions(){
        return []
    }

    //overwrite by Mini-Blockchain Mining
    _simulatedNextBlockMining(nextBlock){
    }

    /**
     * mine next block
     */
    async mineNextBlock(showMiningOutput, suspend){

        while (this.started && !global.TERMINATED){

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
                nextBlock = this.blockchain.blockCreator.createBlockNew(this.minerAddress, nextTransactions );

                nextBlock.difficultyTargetPrev = this.blockchain.getDifficultyTarget();
                nextBlock.reward = BlockchainMiningReward.getReward(nextBlock.height);


            } catch (Exception){
                console.log(colors.red("Error creating next block "), Exception, nextBlock);
            }

            try{


                //simulating the new block and calculate the hashAccountantTree
                if (!await this.blockchain.processBlocksSempahoreCallback(  ()=>{
                        return  this.blockchain.simulateNewBlock(nextBlock, true, ()=>{
                            return this._simulatedNextBlockMining(nextBlock);
                        });
                    })) throw "Mining1 returned False";


            } catch (Exception){
                console.log(colors.red("Error processBlocksSempahoreCallback "+Exception.toString()), Exception, nextBlock);
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

        if(this.finish === undefined)
            this.finish = 0;
        this.finish++;

        console.log("");
        console.log(" ----------- mineBlock-------------");

        try{
            console.log("difficultydifficultydifficulty", difficulty === undefined || difficulty === null);

            if (difficulty === undefined || difficulty === null) throw 'difficulty not specified';

            if (difficulty instanceof BigInteger)
                difficulty = Serialization.serializeToFixedBuffer(consts.BLOCKS_POW_LENGTH, Serialization.serializeBigInteger(difficulty));

            if (block === undefined || block === null) throw "block is undefined";

            block._computeBlockHeaderPrefix(); //calculate the Block Header Prefix

            this._nonce = initialNonce||0;

            if (typeof this._nonce !== 'number') return 'initial nonce is not a number';

            //calculating the hashes per second

            if (showMiningOutput)
                intervalMiningOutput = this.setMiningHashRateInterval();


            let answer;

            try {
                answer = await this.mine(block, difficulty);
            } catch (exception){
                console.log(colors.red("Couldn't mine block " + block.height + exception.toString()), exception);
                answer.result = false;
            }

            if (answer.result){
                console.log( colors.green("WebDollar Block ", block.height ," mined (", answer.nonce+")", answer.hash.toString("hex"), " reward", block.reward, "WEBD") );

                try {

                    if (!await this.blockchain.processBlocksSempahoreCallback(() => {
                            block.hash = answer.hash;
                            block.nonce = answer.nonce;
                            return this.blockchain.includeBlockchainBlock(block, false, [], true, {});
                        })) throw "Mining2 returned false";

                } catch (exception){

                    console.log(colors.red("Mining processBlocksSempahoreCallback raised an error " + block.height + exception.toString()), exception);
                }

            } else
            if (!answer.result)
                console.log( colors.red("block ", block.height ," was not mined...") );

            if (this.reset) // it was reset
                this.reset = false;

            if ( intervalMiningOutput !== undefined)
                clearInterval(intervalMiningOutput);

        } catch (Exception){

            console.log( colors.red("Error mining block "), Exception, block);

            if (intervalMiningOutput !== undefined) clearInterval(intervalMiningOutput);
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


    setMiningHashRateInterval(){

        return setInterval(() => {
            console.log( this._hashesPerSecond+ " hashes/s");

            this.emitter.emit("mining/hash-rate", this._hashesPerSecond );

            this._hashesPerSecond = 0;

        }, 1000);
    }


    setMinerAddress(newMinerAddress){

        //console.log("setMinerAddress", newMinerAddress);

        if (newMinerAddress === undefined || newMinerAddress === '' || newMinerAddress === null){
            console.log(colors.red("No Miner Address defined"));
            this.minerAddress = undefined;
            this.minerAddressBase = '';
            return;
        }

        if (!Buffer.isBuffer(newMinerAddress))
            newMinerAddress = BufferExtended.fromBase(newMinerAddress);

        this.minerAddress = newMinerAddress;
        this.minerAddressBase = BufferExtended.toBase(newMinerAddress);

        this.emitter.emit('mining/miner-address-changed', BufferExtended.toBase(this.minerAddress));

    }

}

export default InterfaceBlockchainMining;