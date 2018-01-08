import MainBlockchainWallet from 'main-blockchain/wallet/Main-Blockchain-Wallet'
import MainBlockchain from 'main-blockchain/chain/Main-Blockchain'
import MainBlockchainMining from 'main-blockchain/mining/Main-Blockchain-Mining'
import MainBlockchainProtocol from 'main-blockchain/blockchain-protocol/Main-Blockchain-Protocol'
import MainBlockchainBalances from "main-blockchain/balances/Main-Blockchain-Balances";

class Blockchain{

    constructor(){

        this.Protocol = new MainBlockchainProtocol(this.Chain);

        this.Chain = new MainBlockchain(this.Protocol);
        this.blockchain = this.Chain;

        this.Protocol.blockchain = this.Chain;

        this.Wallet = new MainBlockchainWallet(this.Chain);

        this.Mining = new MainBlockchainMining(this.Chain, undefined );

        this.Balances = new MainBlockchainBalances(this.Chain);

        this.Accountant = this.Chain.Accountant;

        this.initializeBlockchain();

    }

    async initializeBlockchain(){

        //loading the Wallet
        try{

            let response = await this.Wallet.loadAddresses();

            if (response === false || this.Wallet.addresses.length === 0)
                await this.Wallet.createNewAddress(); //it will save automatically

        } catch (exception){
            console.log("exception loading Wallet.Addresses")

            await this.Wallet.createNewAddress(); //it will save automatically
        }

        //loading the blockchain
        await this.loadBlockchain();

        //starting mining
        await this.initializeMining();

    }


    async initializeMining(){

        console.log("initializeMining started", await this.Wallet.getMiningAddress());
        await this.Mining.setMinerAddress(await this.Wallet.getMiningAddress() );

        if (process.env.START_MINING === 'true'){
            this.Mining.startMining();
        }
    }

    async loadBlockchain(){

        let chainLoaded = await this.Chain.load();

        if (chainLoaded !== true) {
            await this.Chain.save();
            return false;
        }


        return true;
    }


}

export default new Blockchain()