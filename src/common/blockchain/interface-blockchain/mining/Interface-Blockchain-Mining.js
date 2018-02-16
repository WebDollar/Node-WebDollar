import BufferExtended from "../../../utils/BufferExtended";

const BigInteger = require('big-integer');
const colors = require('colors/safe');
const EventEmitter = require('events');

import consts from 'consts/const_global'
import global from 'consts/global'

import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'
import Serialization from 'common/utils/Serialization'

import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB';
import InterfaceBlockchainAddressHelper from "../addresses/Interface-Blockchain-Address-Helper";



class InterfaceBlockchainMining{


    constructor (blockchain, minerAddress){

        this.emitter = new EventEmitter();

        this._minerAddress = undefined;
        this._unencodedMinerAddress = undefined;

        this.blockchain = blockchain;

        if (minerAddress !== undefined)
            this.minerAddress = minerAddress;

        this._nonce = 0;
        this.started = false;
        this._hashesPerSecond = 0;

        this.walletDB = new InterfaceSatoshminDB(consts.DATABASE_NAMES.WALLET_DATABASE);
    }

    async saveMinerAddress(minerAddress){

        if (minerAddress === undefined)
            minerAddress = this.minerAddress;

        if (typeof minerAddress === "object" && minerAddress.hasOwnProperty("address"))
            minerAddress = minerAddress.address;

        let key = "minerAddress";

        try {

            return (await this.walletDB.save(key, minerAddress));
        }
        catch(err) {
            console.error('ERROR on SAVE miner address: ', err);
            return false;
        }

    }

    async loadMinerAddress(defaultAddress){

        let key = "minerAddress";

        try {
            let minerAddress = await this.walletDB.get(key);

            if (minerAddress === null || minerAddress === undefined) {
                this.minerAddress = defaultAddress;
                return true;
            }

            this._setAddress(minerAddress, false);

            return true;
        }
        catch(err) {
            console.error( 'ERROR on LOAD miner address: ', err);
            return false;
        }
    }

    get minerAddress(){
      return this._minerAddress;
    }

    get unencodedMinerAddress(){
        return this._unencodedMinerAddress;
    }

    set minerAddress(newAddress){
        return this._setAddress(newAddress, true)
    }

    _setAddress(newAddress, save=true){

        if (typeof newAddress === "object" && newAddress.hasOwnProperty("address"))
            newAddress = newAddress.address;

        if (Buffer.isBuffer(newAddress)) newAddress = BufferExtended.toBase(newAddress);

        this._minerAddress = newAddress;
        if (newAddress === undefined)
            this._unencodedMinerAddress = undefined;
        else
            this._unencodedMinerAddress = InterfaceBlockchainAddressHelper.validateAddressChecksum(newAddress);

        this.blockchain.emitter.emit( 'blockchain/mining/address', { address: this._minerAddress, unencodedAddress: this._unencodedMinerAddress});

        if (!save) return true;
        else return this.saveMinerAddress();
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
                nextBlock = this.blockchain.blockCreator.createBlockNew(this.unencodedMinerAddress, nextTransactions );

                nextBlock.difficultyTargetPrev = this.blockchain.getDifficultyTarget();
                nextBlock.reward = BlockchainMiningReward.getReward(nextBlock.height);


            } catch (Exception){
                console.log(colors.red("Error creating next block "), Exception, nextBlock);
            }

            try{


                //simulating the new block and calculate the hashAccountantTree
                if (! (await this.blockchain.semaphoreProcessing.processSempahoreCallback(  ()=>{
                        return  this.blockchain.simulateNewBlock(nextBlock, true, ()=>{
                            return this._simulatedNextBlockMining(nextBlock);
                        });
                    }))) throw "Mining1 returned False";


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

        console.log("");
        console.log(" ----------- mineBlock-------------");

        try{
            console.log("difficultydifficultydifficulty", difficulty === undefined || difficulty === null);

            if (difficulty === undefined || difficulty === null)
                throw 'difficulty not specified';

            if (difficulty instanceof BigInteger)
                difficulty = Serialization.serializeToFixedBuffer(consts.BLOCKS_POW_LENGTH, Serialization.serializeBigInteger(difficulty));

            if (block === undefined || block === null)
                throw "block is undefined";

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
                console.log(colors.red("Couldn't mine block " + block.height + exception.toString()), exception);
                answer.result = false;
            }

            if (answer.result && this.blockchain.blocks.length === block.height ){
                console.log( colors.green("WebDollar Block ", block.height ," mined (", answer.nonce+")", answer.hash.toString("hex"), " reward", block.reward, "WEBD") );

                try {

                    if (! (await this.blockchain.semaphoreProcessing.processSempahoreCallback(() => {
                            block.hash = answer.hash;
                            block.nonce = answer.nonce;

                            //returning false, because a new fork was changed in the mean while
                            if (this.blockchain.blocks.length !== block.height) return false;

                            return this.blockchain.includeBlockchainBlock(block, false, [], true, {});
                        }))) throw "Mining2 returned false";

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

}

export default InterfaceBlockchainMining;