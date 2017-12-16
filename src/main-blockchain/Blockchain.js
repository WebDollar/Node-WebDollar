import MainBlockchainWallets from 'main-blockchain/wallets/Main-Blockchain-Wallets'
import MainBlockchain from 'main-blockchain/chain/Main-Blockchain'
import MainBlockchainMining from 'main-blockchain/mining/Main-Blockchain-Mining'
import MainBlockchainProtocol from 'main-blockchain/blockchain-protocol/Main-blockchain-Protocol'

class Blockchain{

    constructor(){
        this.Chain = new MainBlockchain();
        this.blockchain = this.Chain;

        this.Wallets = new MainBlockchainWallets(this.Chain);
        this.Mining = new MainBlockchainMining(this.Chain);
        this.Protocol = new MainBlockchainProtocol(this.Chain);

    }

}

export default new Blockchain()