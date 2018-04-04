import NodesList from 'node/lists/nodes-list'
import InterfaceBlockchainProtocol from "./../protocol/Interface-Blockchain-Protocol"
import MiniBlockchainProtocol from "common/blockchain/mini-blockchain/protocol/Mini-Blockchain-Protocol"
import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'

const EventEmitter = require('events');

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

        this._eventEmitter = new EventEmitter();

        this.synchronized = false;

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

        if ( this.blockchain.blocks.length > 0 ) {

            let done = true;

            if (this._synchronizeComplete)
                for (let i = 0; i < NodesList.nodes.length; i++)
                    if (NodesList.nodes[i].socket.level <= 2 && NodesList.nodes[i].socket.node.protocol.agent.startedAgentDone === false) {

                        done = false;
                        break;
                    }

            console.log("done param", done);

            //in case the agent is done and at least 4 nodes were tested
            if (done === true &&  NodesList.nodes.length >= this.NODES_LIST_MINIM_LENGTH && this.agentQueueCount >= this.AGENT_QUEUE_COUNT_MIN) {

                this.synchronized = true;

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

        this._synchronized = false;
        this._synchronizeComplete = synchronizeComplete;

        this.initializeAgentPromise();

        if (firsTime)
            this._requestBlockchainForNewPeers();

        return await this.waitSynchronizationStatus();

    }

    _setStartAgentTimeOut(factor = 1){

        console.log("_setStartAgentTimeOut");

        if (this._startAgentTimeOut !== undefined)
            return;

        this._startAgentTimeOut = setTimeout( () => {


            this._startAgentTimeOut = undefined;
            this.synchronized = false;

        }, this.AGENT_TIME_OUT*factor);
    }

    set synchronized(newValue){

        this._synchronized = newValue;

        if (newValue){

            console.warn("Synchronization done");

            this._eventEmitter.emit('agent/synchronized', {
                result: true,
                message: "Start Agent worked successfully",
            });

        } else {

            console.warn( "Synchronization done FAILED");

            this._eventEmitter.emit('agent/synchronized', {
                result: false,
                message: "Start Agent Timeout",
            });

        }

    }

    get synchronized(){
        return this._synchronized;
    }


    waitSynchronizationStatus(){

        return new Promise((resolve)=>{

            this._eventEmitter.once('agent/synchronized',(answer)=>{

                resolve(answer);

            });

        });

    }

}

export default InterfaceBlockchainAgent;