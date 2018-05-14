import NodesList from 'node/lists/Nodes-List'
import InterfaceBlockchainProtocol from "./../protocol/Interface-Blockchain-Protocol"
import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import VersionCheckerHelper from "common/utils/helpers/Version-Checker-Helper"
import CONNECTION_TYPE from "node/lists/types/Connections-Type";
import Blockchain from "main-blockchain/Blockchain"
import AGENT_STATUS from "./Agent-Status";
import consts from 'consts/const_global'
import InterfaceBlockchainAgentBasic from "./Interface-Blockchain-Agent-Basic"

/**
 *
 * Agent 47   - The place I was raised, they didn't give us names. They gave us numbers. Mine was 47.
 *
 *
 * An Agent is a class that force your machine to synchronize to the network based on the protocol you use it
 */

class InterfaceBlockchainAgent extends InterfaceBlockchainAgentBasic{

    constructor( blockchain ){

        super(blockchain);

        if (VersionCheckerHelper.detectMobileAndTablet())
            this.AGENT_TIME_OUT = 140*1000;
        else
            this.AGENT_TIME_OUT = 120*1000;

        this.AGENT_TIME_INTERVAL = 500;

        this._startAgentTimeOut = undefined;
        this._startAgentInterval = undefined;

        this._newProtocol();

    }


    newFork(){
        let fork = new InterfaceBlockchainFork();
        InterfaceBlockchainFork.prototype.initializeConstructor.apply(fork, arguments);

        return fork;
    }

    _newProtocol(){
        this.protocol = new InterfaceBlockchainProtocol(this.blockchain, this);
    }

    _initializeProtocol(){
        this.protocol.initialize(["acceptBlockHeaders"]);
    }

    initializeAgentPromise(){

        clearTimeout(this._startAgentTimeOut);
        this._startAgentTimeOut = undefined;

        clearInterval(this._startAgentInterval);
        this._startAgentInterval = undefined;

        this._setStartAgentInterval();
        this._setStartAgentTimeOut();
    }

    initializeStartAgentOnce(){

        this._initializeProtocol();

        NodesList.emitter.on("nodes-list/disconnected", async (result) => {

            if (NodesList.nodes.length === 0) { //no more sockets, maybe I no longer have internet

                console.warn("################### RESYNCHRONIZATION STARTED ##########");
                Blockchain.synchronizeBlockchain();

            }

        });
    }

    async startAgent(firsTime, synchronizeComplete=false){

        console.warn("startAgent was started");
        this.status = AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED;

        this.initializeAgentPromise();
        return await this.waitSynchronizationStatus();

    }

    _agentConfirmationIntervalFunction(){

        if (this.blockchain.blocks.length <= 0) return false;
        if ( NodesList.countNodesByConnectionType(CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET) <= 0 && !consts.DEBUG  ) return false;


        if (process.env.BROWSER)
            this.status = AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED;
        else { //terminal

            //let's check if we downloaded blocks in the last 2 minutes
            let set = false;

            if (this.lastTimeChecked !== undefined ){

                if ( (new Date().getTime() -  this.lastTimeChecked.date > 4*60*1000) || consts.DEBUG ){

                    let diffBlocks = this.blockchain.blocks.length - this.lastTimeChecked.blocks;

                    if (  (NodesList.nodes.length > 0 && diffBlocks > 1 && diffBlocks < consts.SETTINGS.PARAMS.CONNECTIONS.FORKS.MAXIMUM_BLOCKS_TO_DOWNLOAD) || consts.DEBUG ){

                        this.status = AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED;

                    }

                    set = true;
                }

            }  else
                set = true;


            if (set)
                this.lastTimeChecked ={

                    date: new Date().getTime(),
                    blocks: this.blockchain.blocks.length,

                }

        }

    }

    _setStartAgentInterval(){

        if (this._startAgentInterval !== undefined) return;

        this._startAgentInterval = setInterval( this._agentConfirmationIntervalFunction.bind(this) , this.AGENT_TIME_INTERVAL );

    }

    _setStartAgentTimeOut(factor = 1){

        if (this._startAgentTimeOut !== undefined) return;

        this._startAgentTimeOut = setTimeout( () => {


            this._startAgentTimeOut = undefined;

            this.status = AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED;

        }, this.AGENT_TIME_OUT);
    }




    waitSynchronizationStatus(){

        return new Promise((resolve)=>{

            this._eventEmitter.once('agent/synchronized',(answer)=>{
                resolve(answer);
            });

        });

    }

    set status(newValue){

        this._status = newValue;

        if ( [AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED, AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED].indexOf(newValue) >= 0){

            clearTimeout(this._startAgentTimeOut);
            this._startAgentTimeOut = undefined;

            clearInterval(this._startAgentInterval);
            this._startAgentInterval = undefined;

        }

        if ( AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED === newValue)

            this._eventEmitter.emit('agent/synchronized', {
                result: true,
                message: "Start Agent worked successfully",
            });

        else if ( AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED === newValue)

            this._eventEmitter.emit('agent/synchronized', {
                result: false,
                message: "Start Agent Timeout",
            });


    }




}

export default InterfaceBlockchainAgent;