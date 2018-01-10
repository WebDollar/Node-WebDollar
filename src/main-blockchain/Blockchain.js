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

        this.emitter = this.blockchain.emitter;

        this.Protocol.blockchain = this.Chain;

        this.Wallet = new MainBlockchainWallet(this.Chain);

        this.Mining = new MainBlockchainMining(this.Chain, undefined );

        this.Balances = new MainBlockchainBalances(this.Chain);

        this.Accountant = this.Chain.Accountant;

        this.initializeBlockchain();

    }

    async initializeBlockchain(){

        //loading the Wallet
        this.emitter.emit('blockchain/status', {message: "Wallet Loading"});
        try{

            let response = await this.Wallet.loadAddresses();

            if (response !== false)
                this.emitter.emit('blockchain/status', {message: "Wallet Loaded Successfully"});

            if (response === false || this.Wallet.addresses.length === 0) {
                await this.Wallet.createNewAddress(); //it will save automatically

                this.emitter.emit('blockchain/status', {message: "Wallet Creating New Wallet"});
            }

        } catch (exception){

            console.log("exception loading Wallet.Addresses");

            this.emitter.emit('blockchain/status', {message: "Wallet Error Loading and Creating"});

            await this.Wallet.createNewAddress(); //it will save automatically
        }

        //starting mining
        await this.initializeMining();

        //loading the blockchain
        await this.loadBlockchain();

        await this.startMining();

        this.emitter.emit('blockchain/status', {message: "Blockchain Ready to Mine"});


        this.emitter.emit('blockchain/status-webdollar', {message: "Ready"});

    }

    async initializeMining(){

        await this.Mining.setMinerAddress(await this.Wallet.getMiningAddress() );
        this.emitter.emit('blockchain/status', {message: "Mining Setting Address"});

    }

    async startMining(){

        await this.Mining.setMinerAddress(await this.Wallet.getMiningAddress() );

        if (process.env.START_MINING === 'true'){
            this.Mining.startMining();
        }

    }

    async loadBlockchain(){

        this.emitter.emit('blockchain/status', {message: "Blockchain Loading"});

        let chainLoaded = await this.Chain.load();

        if (chainLoaded !== true) {
            await this.Chain.save();
            return false;
        }


        this.emitter.emit('blockchain/status', {message: "Blockchain Loaded Successfully"});
        return true;
    }


}

export default new Blockchain()