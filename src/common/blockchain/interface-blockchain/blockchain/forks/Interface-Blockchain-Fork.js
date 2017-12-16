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


    constructor (blockchain, forkId, sockets, forkStartingHeight){

        this.blockchain = blockchain;

        this.forkId = forkId;

        if (!Array.isArray(sockets))
            sockets = [sockets]

        this.sockets = sockets;
        this.forkStartingHeight = forkStartingHeight||0;
        this.forkBlocks = [];

    }

    async validateFork(){

        for (let i=0; i<this.forkBlocks.length; i++){

            if (! await this.validateForkBlock(this.forkBlocks[i], this.forkStartingHeight + i, i )) return false;

        }

        return true;
    }

    async includeForkBlock(block){

    }

    async validateForkBlock(block, height, forkHeight){


        if (block.height < this.forkStartingHeight) throw 'block height is smaller than the fork itself';
        else
        // transition from blockchain to fork
        if (height === 0 || height === this.forkStartingHeight){

            return await this.blockchain.validateBlockchainBlock(block);

        } else { // just the fork

            let prevDifficultyTarget = this.forkBlocks[forkHeight-1].difficultyTarget;
            let prevHash = this.forkBlocks[forkHeight-1].hash;
            let prevTimeStamp = this.forkBlocks[forkHeight-1].timeStamp;

            return await this.blockchain.validateBlockchainBlock(block, prevDifficultyTarget, prevHash, prevTimeStamp);

        }

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