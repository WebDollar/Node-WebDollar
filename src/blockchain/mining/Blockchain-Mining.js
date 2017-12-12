import MiniBlockchainMining from 'common/blockchain/mini-blockchain/Mini-Blockchain-Mining'

import BlockchainChain from 'blockchain/chain/BlockchainChain'

class BlockchainMining{

    constructor(){
        this.mining = new MiniBlockchainMining(BlockchainChain);
    }

    startMining(){
        console.log("Mining started");
        this.mining.startMining();
    }

    stop(){

        console.log("Mining Stopped");
        this.mining.stopMining();

    }

}

export default new BlockchainMining()