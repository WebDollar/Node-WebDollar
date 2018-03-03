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

    constructor( blockchain){

        this.blockchain = blockchain;

        this.agentQueueProcessing = [];
        this.agentQueueCount = 0;

        this.AGENT_TIME_OUT = 40000;
        this.AGENT_QUEUE_COUNT_MAX = 1;
        this.NODES_LIST_MINIM_LENGTH = 1;

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

        // let's ask everybody

        clearTimeout(this._startAgentTimeOut);
        this._startAgentTimeOut = undefined;

        try {

            let queueIndex = this.agentQueueProcessing.length-1;
            this.agentQueueProcessing.push(true);
            let answerBlockchain = await this.protocol.askBlockchain(result.socket);
            console.log("answerBlockchain", this.agentQueueProcessing.length);
            this.agentQueueProcessing.splice(queueIndex, 1);

        } catch (exception) {
            console.error("Error asking for Blockchain", exception);
        }

        result.socket.node.protocol.agent.startedAgentDone = true;
        this.agentQueueCount++;

        //check if start Agent is finished

        console.log("this.startAgentResolver",this.startAgentResolver !== undefined);
        console.log("this.agentQueueProcessing", this.agentQueueProcessing .length);
        if (this.startAgentResolver !== undefined && this.agentQueueProcessing.length === 0) {

            let done = true;
            for (let i = 0; i < NodesList.nodes.length; i++)
                if (NodesList.nodes[i].socket.level <= 2 && NodesList.nodes[i].socket.node.protocol.agent.startedAgentDone === false) {

                    done = false;
                    // console.log("not done", NodesList.nodes[i]);
                    break;
                }

            //in case the agent is done and at least 4 nodes were tested
            if (done === true && this.startAgentResolver !== undefined &&
                NodesList.nodes.length >= this.NODES_LIST_MINIM_LENGTH && this.agentQueueCount >= this.AGENT_QUEUE_COUNT_MAX) {

                if (this.startAgentResolver === undefined) return;

                let resolver = this.startAgentResolver;
                this.startAgentResolver = undefined;

                console.warn("Synchronization done");

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
            console.log("initializeStartAgent() this.startAgentResolver");
            this.startAgentResolver = resolve;
        });

        clearTimeout(this._startAgentTimeOut);
        this._startAgentTimeOut = undefined;

        this._setStartAgentTimeOut();
    }

    initializeStartAgent(){
        this._initializeProtocol();
    }

    async startAgent(firsTime){
        console.warn("startAgent was started");

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

            if (this.startAgentResolver === undefined)
                return;

            let resolver = this.startAgentResolver;
            this.startAgentResolver = undefined;

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