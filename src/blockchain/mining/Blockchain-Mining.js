import MiniBlockchainMining from 'common/blockchain/mini-blockchain/Mini-Blockchain-Mining'

class BlockchainMining{

    constructor(){
        this.mining = new MiniBlockchainMining();
    }

    startMining(){

        this.mining.startMining();
    }

    stop(){

        this.mining.stopMining();

    }

}

export default new BlockchainMining()