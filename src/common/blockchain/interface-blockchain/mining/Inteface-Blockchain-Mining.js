var BigInteger = require('big-integer');
const colors = require('colors/safe');

import consts from 'consts/const_global'

import BlockchainMiningReward from 'common/blockchain/Blockchain-Mining-Reward'
import Serialization from 'common/utils/Serialization'

class InterfaceBlockchainMining{


    constructor (blockchain, minerAddress){

        this.blockchain = blockchain;

        this.minerAddress = minerAddress;

        this.nonce = null;
        this.finished = true;

    }

    async startMining(){

        this.finished = false;
        this.reset = false;

        await this.mineNextBlock(true);
    }

    stopMining(){

        this.finished = true;

    }

    resetMining(){
        this.reset = true;
    }

    /**
     * mine next block
     */
    async mineNextBlock(showMiningOutput){

        while (!this.finished){
            //mining next blocks

            let nextBlock;

            try {
                nextBlock = this.blockchain.blockCreator.createBlockNew(this.minerAddress);
            } catch (Exception){
                console.log(colors.red("Error creating next block "+Exception.toString()), Exception, nextBlock);
            }

            await this.mineBlock( nextBlock, this.blockchain.getDifficultyTarget(), undefined, showMiningOutput  );
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
            if (difficulty === undefined || difficulty === null)
                throw 'difficulty not specified';

            if (difficulty instanceof BigInteger)
                difficulty = Serialization.serializeToFixedBuffer(consts.BLOCKS_POW_LENGTH, Serialization.serializeBigInteger(difficulty));

            if (block === undefined || block === null) throw "block is undefined";

            block._computeBlockHeaderPrefix(); //calculate the Block Header Prefix

            let nonce = initialNonce||0, solutionFound = false;

            if (typeof nonce !== 'number') return 'initial nonce is not a number';

            //calculating the hashes per second
            let intervalMiningOutput;
            if (showMiningOutput) {
                let previousNonce = nonce;
                intervalMiningOutput = setInterval(() => {
                    console.log((nonce - previousNonce).toString() + " hashes/s");
                    previousNonce = nonce
                }, 1000);
            }


            while (nonce <= 0xFFFFFFFF && !this.finished && !this.reset ){

                let hash = await block.computeHash(nonce);

                //console.log('Mining WebDollar Argon2 - nonce', nonce, hash.toString("hex") );


                if ( hash.compare(difficulty) <= 0 ) {

                    block.reward = BlockchainMiningReward.getReward(block.height);

                    console.log( colors.green("WebDollar Block ", block.height ," mined ", nonce, hash.toString("hex"), " reward", block.reward, "WEBD") );

                    block.hash = hash;
                    block.nonce = nonce;

                    await this.blockchain.processBlocksSempahoreCallback( ()=>{
                        return this.blockchain.includeBlockchainBlock( block );
                    });

                    solutionFound = true;

                    break;
                }

                nonce++;
            }

            if (!solutionFound){
                console.log( colors.red("block ", block.height ," was not mined...") );
            }

            if (this.reset){ // it was reseted
                this.reset = false;
            }

            if ( intervalMiningOutput !== undefined)
                clearInterval(intervalMiningOutput);

        } catch (Exception){

            console.log(colors.red("Error mining block "), Exception, block);
            throw Exception;

        }

    }



}

export default InterfaceBlockchainMining;