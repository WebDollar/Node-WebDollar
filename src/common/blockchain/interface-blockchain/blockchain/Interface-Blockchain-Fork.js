import NodeProtocol from 'common/sockets/protocol/node-protocol';

import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/interface-blockchain/blocks/Blockchain-Genesis'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'
import InterfaceBlockchainDifficulty from 'common/blockchain/interface-blockchain/mining/difficulty/Interface-Blockchain-Difficulty'
/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchainFork {


    constructor (blockchain, forkStartingHeight){

        this.blockchain = blockchain;

        this.forkStartingHeight = forkStartingHeight||0;
        this.forkBlocks = [];

    }

    async validateFork(){

        for (let i=0; i<this.forkBlocks.length; i++){

            if (! await this.validateForkBlock(this.forkBlocks[i], this.forkStartingHeight + i )) return false;

        }

        return true;
    }

    async includeForkBlock(block){

    }

    async validateForkBlock(block, height){

    }


    /**
     * Validate the Fork and Use the fork as main blockchain 
     */
    async saveFork(){

        await this.validateFork();
        // to do

    }



}

export default InterfaceBlockchainFork;