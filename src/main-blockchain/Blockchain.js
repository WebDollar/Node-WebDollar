import MainBlockchainWallet from 'main-blockchain/wallet/Main-Blockchain-Wallet'
import MainBlockchain from 'main-blockchain/chain/Main-Blockchain'
import MainBlockchainMining from 'main-blockchain/mining/Main-Blockchain-Mining'
import MainBlockchainProtocol from 'main-blockchain/blockchain-protocol/Main-Blockchain-Protocol'
import MainBlockchainBalances from "main-blockchain/balances/Main-Blockchain-Balances";

class Blockchain{

    constructor(){

        this.Chain = new MainBlockchain();
        this.blockchain = this.Chain;

        this.Wallet = new MainBlockchainWallet(this.Chain);
        this.Mining = new MainBlockchainMining(this.Chain, this.Wallet.getMiningAddress() );
        this.Protocol = new MainBlockchainProtocol(this.Chain);

        this.Balances = new MainBlockchainBalances(this.Chain);

        this.Accountant = this.Chain.Accountant;

    }

}

export default new Blockchain()