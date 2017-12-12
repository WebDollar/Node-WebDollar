var BigInteger = require('big-integer');

import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'
import BlockchainGenesis from 'common/blockchain/interface-blockchain/blocks/Blockchain-Genesis'

class InterfaceBlockchainMining{


    constructor (blockchain, minerAddress){

        this.blockchain = blockchain;

        this.minerAddress = minerAddress;

        this.nonce = null;
        this.difficulty = null;
        this.finished = true;

    }

    startMining(){

        this.finished = false;

        this.mine();
    }

    stopMining(){

        this.finished = true;

    }

    /**
     * mine next block
     */
    async mine(){

        let nextBlock;


        await this.mineBlock( this.blockchain.blockCreator.createBlock(this.minerAddress), this.blockchain.difficulty, undefined  );

    }

    /**
     * Mine a specific Block
     * @param block
     * @param difficulty
     * @param initialNonce
     */
    async mineBlock( block,  difficulty, initialNonce ){

        if (typeof difficulty === "undefined" && difficulty !== null && difficulty !== this.difficulty)
            this.setDifficulty(difficulty);
        else throw 'difficulty not specified';

        block.calculateBlockHeaderPrefix(); //calculate the Block Header Prefix

        let nonce = initialNonce||0;

        if (typeof nonce !== 'number') return 'initial nonce is not a number'

        while (nonce <= 0xFFFFFFFF && !this.finished ){

            let hash = await block.hash(nonce);

            console.log('Mining WebDollar Argon2 - nonce', nonce, hash.toString("hex") );

            if ( hash >= difficulty)
                break;

            nonce++;

        }

    }

    setDifficulty(newDifficulty){

        if (newDifficulty instanceof BigInteger){

            this.difficulty = WebDollarCryptoData.createWebDollarCryptoData( newDifficulty).toFixedBuffer( 32 );

        } else
        this.difficulty = newDifficulty;

    }


}

export default InterfaceBlockchainMining;