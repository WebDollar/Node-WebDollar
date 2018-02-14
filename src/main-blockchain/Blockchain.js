import MainBlockchainWallet from 'main-blockchain/wallet/Main-Blockchain-Wallet'
import MainBlockchain from 'main-blockchain/chain/Main-Blockchain'
import MainBlockchainMining from 'main-blockchain/mining/Main-Blockchain-Mining'
import MainBlockchainProtocol from 'main-blockchain/blockchain-protocol/Main-Blockchain-Protocol'
import MainBlockchainAgent from 'main-blockchain/agents/Main-Blockchain-Agent'
import MainBlockchainBalances from "main-blockchain/balances/Main-Blockchain-Balances";
import ValidityState from "common/utils/validation/Validations-Utils";
import NodesList from 'node/lists/nodes-list'

class Blockchain{

    constructor(){

        this.Chain = new MainBlockchain(undefined);
        this.blockchain = this.Chain;

        this.emitter = this.blockchain.emitter;

        this.Wallet = new MainBlockchainWallet(this.Chain);

        this.Mining = new MainBlockchainMining(this.Chain, undefined );

        this.Balances = new MainBlockchainBalances(this.Chain);

        this.Accountant = this.Chain.Accountant;

        this.onLoaded = new Promise((resolve)=>{
            this._onLoadedResolver = resolve;
        });

        NodesList.emitter.on("nodes-list/disconnected", async (result) => {

            if (NodesList.nodes.length === 0) { //no more sockets, maybe I no longer have internet
                console.log("################### RESYNCHRONIZATION STARTED ##########");
                this.Mining.stopMining();
                this.emitter.emit('blockchain/status-webdollar', {message: "No Internet Access"});
                await this.synchronizeBlockchain();
            }
        });

    }

    async createBlockchain(agentName, initializationCallback){


        this.Agent = MainBlockchainAgent.createAgent(agentName, this.blockchain);
        this.Agent.setBlockchain(this.blockchain)

        this.blockchain._setAgent(this.Agent);

        //Waiting Until a Single Window is present
        let validation = new ValidityState(this);

        await validation.waitSingleTab( ()=>{
            this.emitter.emit('blockchain/status-webdollar', {message: "Multiple Windows Detected"});
        });
        this.emitter.emit('blockchain/status-webdollar', {message: "Single Window"});

        if (typeof initializationCallback === "function")
            initializationCallback();

        await this.initializeBlockchain();
    }

    async initializeBlockchain(){

        await this.Wallet.loadWallet();

        //starting mining
        await this.initializeMining();

        //loading the blockchain
        await this.loadBlockchain();

        await this.Agent.initializeStartAgent();

        //it tries synchronizing multiple times
        await this.synchronizeBlockchain(true);

        this._onLoadedResolver("Ready");
        this._onLoadedResolver = "done";

    }

    async initializeMining(){

        await this.Mining.setMinerAddress(await this.Wallet.getMiningAddress() );
        this.emitter.emit('blockchain/status', {message: "Mining Setting Address"});

    }

    async startMining(){

        await this.Mining.setMinerAddress(await this.Wallet.getMiningAddress() );

        if (process.env.START_MINING)
            this.Mining.startMining();

    }

    async loadBlockchain(){

        this.emitter.emit('blockchain/status', {message: "Blockchain Loading"});

        let chainLoaded = await this.Chain.load();

        this.emitter.emit('blockchain/status', {message: "Blockchain Loaded Successfully"});
        return chainLoaded;
    }

    /**
     * it tries synchronizing multiple times
     * @returns {Promise.<void>}
     */
    async synchronizeBlockchain(firstTime){

        this.emitter.emit('blockchain/status', {message: "Start Synchronizing"});
        let agentInitialization = false;

        while (!agentInitialization){

            this.emitter.emit('blockchain/status', {message: "Synchronizing"});

            let resultAgentStarted = await this.Agent.startAgent(firstTime);
            firstTime = false;

            if (resultAgentStarted.result){

                this.emitter.emit('blockchain/status', {message: "Synchronization Successful"});
                agentInitialization = true;

            } else {

                this.emitter.emit('blockchain/status', { message: "Error Synchronizing" });
                this.emitter.emit('blockchain/status-webdollar', {message: "Error Synchronizing"});

                this.Agent.initializeAgentPromise();
            }

        }

        await this.startMining();

        this.emitter.emit('blockchain/status', {message: "Blockchain Ready to Mine"} );

        this.emitter.emit('blockchain/status-webdollar', {message: "Ready"} );

    }

}

export default new Blockchain()