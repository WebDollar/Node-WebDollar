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


    constructor (blockchain, forkId, sockets, forkStartingHeight, newChainLength){

        this.blockchain = blockchain;

        this.forkId = forkId;

        if (!Array.isArray(sockets))
            sockets = [sockets]

        this.sockets = sockets;
        this.forkStartingHeight = forkStartingHeight||0;
        this.forkHeight = newChainLength||0;
        this.forkBlocks = [];

        this._blocksCopy = [];

    }

    async validateFork(){

        for (let i=0; i<this.forkBlocks.length; i++){

            if (! await this.validateForkBlock(this.forkBlocks[i], this.forkStartingHeight + i, i )) return false;

        }

        return true;
    }

    async includeForkBlock(block){

        if (! await this.validateForkBlock(block, block.height, block.height - this.forkStartingHeight) ) return false;

        this.forkBlocks.push(block);
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

        if (!await this.validateFork()) return false;
        // to do

        let useFork = false;

        if (this.blockchain.getBlockchainLength() < this.forkStartingHeight + this.forkBlocks.length)
            useFork = true;
        else
        if (this.blockchain.getBlockchainLength() === this.forkStartingHeight + this.forkBlocks.length){ //I need to check

        }

        //overwrite the blockchain blocks with the forkBlocks
        if (useFork){

            this._blocksCopy = [];
            for (let i=this.forkStartingHeight; i<this.blockchain.getBlockchainLength(); i++)
                this._blocksCopy.push(this.blockchain.blocks[i]);

            this.blockchain.blocks.splice(this.forkStartingHeight);

            let forkedSuccessfully = true;

            for (let i=0; i<this.forkBlocks.length; i++) {
                if (!await this.blockchain.includeBlockchainBlock(this.forkBlocks[i])){
                    forkedSuccessfully = false;
                    break;
                }
            }

            //rollback
            if (!forkedSuccessfully){
                this.blockchain.blocks.splice(this.forkStartingHeight);
                for (let i=0; i<this._blocksCopy.length; i++)
                    await this.blockchain.includeBlockchainBlock(this._blocksCopy[i])
            }

            this.blockchain.resetMining();

        }

    }



}

export default InterfaceBlockchainFork;