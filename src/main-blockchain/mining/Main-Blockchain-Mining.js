import MiniBlockchainMining from 'common/blockchain/mini-blockchain/Mini-Blockchain-Mining'

class MainBlockchainMining{

    constructor(blockchain){
        this.mining = new MiniBlockchainMining(blockchain);
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

export default  MainBlockchainMining