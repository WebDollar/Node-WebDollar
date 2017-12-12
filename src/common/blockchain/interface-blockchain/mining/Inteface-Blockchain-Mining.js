var BigInteger = require('big-integer');

import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'
import BlockchainGenesis from 'common/blockchain/interface-blockchain/blocks/Blockchain-Genesis'

class InterfaceBlockchainMining{


    constructor (blockchain){

        this.blockchain = blockchain;

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
    mine(){

        let nextBlock;
        if (this.blockchain.getBlockchainLength() === 0){  //Genesis Block

            nextBlock = InterfaceBlockchainBlockCreator.createBlockGenesis( BlockchainGenesis.address );

        } else { //Fetch Transactions and Create Block

            nextBlock = InterfaceBlockchainBlockCreator.createBlock( BlockchainGenesis.address );

        }

        this.mineBlock( this.blockchain.block, this.blockchain.difficulty, undefined  );

    }

    /**
     * Mine a specific Block
     * @param block
     * @param difficulty
     * @param initialNonce
     */
    mineBlock( block,  difficulty, initialNonce ){

        if (typeof difficulty === "undefined" && difficulty !== null && difficulty !== this.difficulty)
            this.setDifficulty(difficulty);
        else throw 'difficulty not specified';

        let nonce = initialNonce||0;

        while (nonce <= 0xFFFFFFFF && !this.finished ){

            let hash = block.hash(nonce);

            if ( hash >= difficulty)
                break;

        }

    }

    setDifficulty(newDifficulty){

        if (newDifficulty instanceof BigInteger){

            this.difficulty = WebDollarCrypto.convertIntToBuffer( newDifficulty, 32 );

        } else
        this.difficulty = newDifficulty;

    }


}

export default InterfaceBlockchainMining;