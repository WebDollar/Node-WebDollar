var BigInteger = require('big-integer');
const colors = require('colors/safe');

import consts from 'consts/const_global'

import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'
import BlockchainGenesis from 'common/blockchain/interface-blockchain/blocks/Blockchain-Genesis'

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
                console.log(colors.red("Error creating next block "+Exception.toString()), nextBlock);
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
            else
                difficulty = WebDollarCryptoData.createWebDollarCryptoData(difficulty).toFixedBuffer(consts.BLOCKS_POW_LENGTH);


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

                    let reward = 50;
                    console.log( colors.green("WebDollar Block ", block.height ," mined ", nonce, hash.toString("hex"), " reward", reward, "WEBD") );

                    block.hash = hash;
                    block.nonce = nonce;

                    await this.blockchain.includeBlockchainBlock( block );
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

            console.log(colors.red("Error mining block ", Exception.toString()), block);
            throw Exception;
        }

    }



}

export default InterfaceBlockchainMining;