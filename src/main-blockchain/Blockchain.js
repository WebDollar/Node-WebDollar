import MainBlockchainWallets from 'main-blockchain/wallets/Main-Blockchain-Wallets'
import MainBlockchain from 'main-blockchain/chain/Main-Blockchain'
import MainBlockchainMining from 'main-blockchain/mining/Main-Blockchain-Mining'

class Blockchain{

    constructor(){
        this.Chain = new MainBlockchain();
        this.blockchain = this.Chain;

        this.Wallets = new MainBlockchainWallets(this.Chain);
        this.Mining = new MainBlockchainMining(this.Chain);
    }

}

export default new Blockchain()