import NodesList from 'node/lists/nodes-list'
import InterfaceBlockchainProtocol from "./../protocol/Interface-Blockchain-Protocol"
import MiniBlockchainProtocol from "common/blockchain/mini-blockchain/protocol/Mini-Blockchain-Protocol"
import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'

/**
 *
 * Agent 47   - The place I was raised, they didn't give us names. They gave us numbers. Mine was 47.
 *
 *
 * An Agent is a class that force your machine to synchronize to the network based on the protocol you use it
 */

class InterfaceBlockchainAgent{

    constructor( blockchain ){

        this.blockchain = blockchain;

        this.agentQueueProcessing = [];
        this.agentQueueCount = 0;

        this.AGENT_TIME_OUT = 40000;
        this.AGENT_TIME_OUT_NEW_CONNECTIONS = 10000;

        this.AGENT_QUEUE_COUNT_MIN = 1;
        this.NODES_LIST_MINIM_LENGTH = 1;

        this._startAgentTimestamp = new Date().getTime();
        this._synchronizeComplete = false;

        this._startAgentResolver = null;
        this._startAgentPromise = null;

        this.newFork();
        this.newProtocol();
    }

    setBlockchain(blockchain){
        this.blockchain = blockchain;
        this.protocol.setBlockchain(blockchain);
    }

    newFork(){
        let fork = new InterfaceBlockchainFork();
        InterfaceBlockchainFork.prototype.initializeConstructor.apply(fork, arguments);

        return fork;
    }

    newProtocol(){
        this.protocol = new InterfaceBlockchainProtocol(this.blockchain, this);
    }

    _initializeProtocol(){
        this.protocol.initialize(["acceptBlockHeaders"]);
    }

    async _requestBlockchainForNewPeer(result) {

        //AGENT_TIME_OUT_NEW_CONNECTIONS
        if (new Date().getTime() - this._startAgentTimestamp >= this.AGENT_TIME_OUT_NEW_CONNECTIONS){
            console.warn("too late for Agent");
            return false;
        }

        // let's ask everybody

        clearTimeout(this._startAgentTimeOut);
        this._startAgentTimeOut = undefined;

        try {

            let queueIndex = this.agentQueueProcessing.length;
            this.agentQueueProcessing.push(true);
            let answerBlockchain = await this.protocol.askBlockchain(result.socket);

            console.log("answerBlockchain", this.agentQueueProcessing.length, queueIndex);

            this.agentQueueProcessing[queueIndex] = undefined;

            let index = this.agentQueueProcessing.length;
            while (index > 0 && this.agentQueueProcessing[index-1] === undefined){
                index --;
            }

            if (index <= 0)
                this.agentQueueProcessing = [];
            else
            if (index !== this.agentQueueProcessing.length)
                this.agentQueueProcessing.splice(index-1);

            console.log("this.agentQueueProcessing2", this.agentQueueProcessing);

        } catch (exception) {
            console.error("Error asking for Blockchain", exception);
        }

        result.socket.node.protocol.agent.startedAgentDone = true;
        this.agentQueueCount++;

        //check if start Agent is finished

        console.log("this.startAgentResolver",this._startAgentResolver !== undefined);
        console.log("this.agentQueueProcessing", this.agentQueueProcessing.length);
        console.log("this.blockchain.blocks.length", this.blockchain.blocks.length);

        if ( this._startAgentResolver !== undefined && this.blockchain.blocks.length > 0 ) {

            let done = true;

            if (this._synchronizeComplete)
                for (let i = 0; i < NodesList.nodes.length; i++)
                    if (NodesList.nodes[i].socket.level <= 2 && NodesList.nodes[i].socket.node.protocol.agent.startedAgentDone === false) {

                        done = false;
                        break;
                    }

            console.log("done param", done);
            console.log("this._startAgentResolver !== undefined", this._startAgentResolver !== undefined)

            //in case the agent is done and at least 4 nodes were tested
            if (done === true && this._startAgentPromise !== undefined &&
                NodesList.nodes.length >= this.NODES_LIST_MINIM_LENGTH && this.agentQueueCount >= this.AGENT_QUEUE_COUNT_MIN) {

                if (this._startAgentResolver === undefined) return;

                let resolver = this._startAgentResolver;
                this._startAgentResolver = undefined;

                console.warn("Synchronization done", resolver);

                resolver({
                    result: true,
                    message: "Start Agent worked successfully",
                });

                return;
            }
        }

        //it is not done, maybe timeout
        this._setStartAgentTimeOut(1);
    }

    async _requestBlockchainForNewPeers(){

        this.agentQueueProcessing = [];
        this.agentQueueCount = 0;

        NodesList.emitter.on("nodes-list/connected", async (result) => {
            await this._requestBlockchainForNewPeer(result);
        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {

        });


        for (let i = 0; i < NodesList.nodes.length; i++)
            await this._requestBlockchainForNewPeer(NodesList.nodes[i]);
    }

    initializeAgentPromise(){

        this._startAgentPromise = new Promise((resolve)=>{
            console.log("initializeStartAgent() this._startAgentResolver");
            this._startAgentResolver = resolve;
        });
        console.log("initializeAgentPromise FINISHED", this._startAgentPromise);

        clearTimeout(this._startAgentTimeOut);

        console.warn("new this._startAgentTimestamp");
        this._startAgentTimestamp = new Date().getTime();
        this._startAgentTimeOut = undefined;

        this._setStartAgentTimeOut();
    }

    initializeStartAgent(){
        this._initializeProtocol();
    }

    async startAgent(firsTime, synchronizeComplete=false){

        console.warn("startAgent was started");

        this._synchronizeComplete = synchronizeComplete;
        this.initializeAgentPromise();

        if (firsTime)
            await this._requestBlockchainForNewPeers();

        return this._startAgentPromise;
    }

    _setStartAgentTimeOut(factor = 1){

        console.log("_setStartAgentTimeOut");

        if (this._startAgentTimeOut !== undefined)
            return;

        this._startAgentTimeOut = setTimeout( () => {

            if (this._startAgentResolver === undefined)
                return;

            let resolver = this._startAgentResolver;
            this._startAgentResolver = undefined;

            console.warn( "Synchronization done FAILED");

            this._startAgentTimeOut = undefined;

            resolver({
                result: false,
                message: "Start Agent Timeout",
            });

        }, this.AGENT_TIME_OUT*factor);
    }

}

export default InterfaceBlockchainAgent;