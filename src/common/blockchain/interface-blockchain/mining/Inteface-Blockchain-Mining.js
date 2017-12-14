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

    startMining(){

        this.finished = false;

        this.mineNextBlock(true);
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

            let nextBlock = this.blockchain.blockCreator.createBlockNew(this.minerAddress);

            await this.mineBlock( nextBlock, this.blockchain.difficultyTarget, undefined, showMiningOutput  );
        }

    }

    /**
     * Mine a specific Block
     * @param block
     * @param difficulty
     * @param initialNonce
     */
    async mineBlock( block,  difficulty, initialNonce, showMiningOutput ){


        if (typeof difficulty !== "undefined" && difficulty !== null)
            difficulty = WebDollarCryptoData.createWebDollarCryptoData(difficulty).toFixedBuffer(consts.BLOCKS_POW_LENGTH);
        else throw 'difficulty not specified';


        block.calculateBlockHeaderPrefix(); //calculate the Block Header Prefix

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


        while (nonce <= 0xFFFFFFFF && !this.finished ){

            let hash = await block.computeHash(nonce);

            //console.log('Mining WebDollar Argon2 - nonce', nonce, hash.toString("hex") );


            if ( hash.compare(difficulty) <= 0 ) {

                let reward = 50;
                console.log( colors.green("WebDollar Block ", block.myHeight ," mined ", nonce, hash.toString("hex"), " reward", reward, "WEBD") );

                block.hash = hash;
                block.nonce = nonce;

                await this.blockchain.includeBlockchainBlock( block );
                solutionFound = true;

                break;
            }

            nonce++;
        }

        if (!solutionFound){
            console.log( colors.red("block ", block.myHeight ," was not mined...") );
        }

        if (typeof intervalMiningOutput !== 'undefined')
            clearInterval(intervalMiningOutput);

    }



}

export default InterfaceBlockchainMining;