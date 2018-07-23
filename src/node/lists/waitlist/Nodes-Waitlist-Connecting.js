import NodesWaitlist from "./Nodes-Waitlist";
import NodeClient from 'node/sockets/node-clients/socket/Node-Client'
import consts from 'consts/const_global'
import NodesList from 'node/lists/Nodes-List'
import CONNECTION_TYPE from "../types/Connection-Type";
import Blockchain from "main-blockchain/Blockchain";
import AGENT_STATUS from "common/blockchain/interface-blockchain/agents/Agent-Status";
import VersionCheckerHelper from "common/utils/helpers/Version-Checker-Helper"
import NODE_TYPE from "node/lists/types/Node-Type"
import NODES_CONSENSUS_TYPE from "../types/Node-Consensus-Type";

let NodeExpress;

if (!process.env.BROWSER) {
    NodeExpress = require('node/sockets/node-server/express/Node-Express').default;
}


class NodesWaitlistConnecting {

    constructor(){

        this.started = false;
        this._connectingQueue = [];


        //mobiles usually use mobile internet are they mostly block non 80 blocks
        this._connectedOnlyTo80 = false;

        if (VersionCheckerHelper.detectMobile())
            this._connectedOnlyTo80 = true;

        this.connectingMaximum = {
            maximum_fallbacks: 0,
            maximum_waitlist: 0,

            minimum_fallbacks:0,
            minimum_waitlist:0,
        };

        setInterval(this._calculateNumberOfConnections.bind(this), 5000);

        this._calculateNumberOfConnections();

    }

    startConnecting(){

        if (this.started)  return;

        this.started = true;
        this._connectNewNodesWaitlistInterval();

    }

    /*
        Connect to all nodes
    */

    _connectNewNodesWaitlist(){

        for (let i=0; i < NodesWaitlist.waitListFullNodes.length; i++){

            // in case it is not synchronized, it should connect to the fallback node
            // if ( Blockchain.blockchain.agent.status === AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED && !NodesWaitlist.waitListFullNodes[i].isFallback)  continue;
            // if ( Blockchain.blockchain.agent.status !== AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED && NodesWaitlist.waitListFullNodes[i].isFallback)  continue;

            // in case it needs to connect only to port 80
            if (this._connectedOnlyTo80 && NodesWaitlist.waitListFullNodes[i].sckAddresses[0].port !== "80") continue;

            this._tryToConnectNextNode(NodesWaitlist.waitListFullNodes[i]);

        }

    }

    _connectNewNodesWaitlistInterval(){

        this._connectNewNodesWaitlist();

        setTimeout( this._connectNewNodesWaitlistInterval.bind(this), consts.SETTINGS.PARAMS.WAITLIST.INTERVAL);
    }

    _tryToConnectNextNode( nextWaitListObject){

        if (Blockchain.MinerPoolManagement !== undefined && Blockchain.MinerPoolManagement.minerPoolStarted && [ NODES_CONSENSUS_TYPE.NODE_CONSENSUS_SERVER ].indexOf(nextWaitListObject.nodeConsensusType) < 0 ) return;

        if (Blockchain.blockchain.agent.consensus) {

            if (nextWaitListObject.isFallback) {

                let fallbacks = this._countConnectingToFallbacks() + NodesList.countFallbacks();
                if (fallbacks >= this.connectingMaximum.maximum_fallbacks) return true;

            } else {

                let simple = (this._connectingQueue.length - this._countConnectingToFallbacks()) + ( NodesList.nodes.length - NodesList.countFallbacks() );
                if (simple >= this.connectingMaximum.maximum_waitlist) return true;

            }

        }

        if (Blockchain.Agent.light && Blockchain.Agent.status === AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED_SLAVES)
            return;

        //connect only to TERMINAL NODES
        if ( nextWaitListObject.nodeType === NODE_TYPE.NODE_TERMINAL) {

            if (nextWaitListObject.checkLastTimeChecked(consts.SETTINGS.PARAMS.WAITLIST.TRY_RECONNECT_AGAIN) && nextWaitListObject.blocked === false &&
                nextWaitListObject.connecting === false && nextWaitListObject.checkIsConnected() === null) {

                nextWaitListObject.blocked = true;
                this._connectingQueue.push(nextWaitListObject);

                this._connectNowToNewNode(nextWaitListObject).then((connected) => {

                    for (let i=this._connectingQueue.length-1; i>=0; i--)
                        if (this._connectingQueue[i] === nextWaitListObject){
                            this._connectingQueue.splice(i,1);
                        }

                    nextWaitListObject.checked = true;
                    nextWaitListObject.blocked = false;
                    nextWaitListObject.connected = connected;
                    nextWaitListObject.refreshLastTimeChecked();

                });

            }

        }
    }

    async _connectNowToNewNode(nextWaitListObject){

        nextWaitListObject.connecting = true;

        //trying to connect to each sckAddresses

        let index = Math.floor( Math.random() * nextWaitListObject.sckAddresses.length );

        //search if the new protocol was already connected in the past
        let nodeClient = NodesList.searchNodeSocketByAddress(nextWaitListObject.sckAddresses[index], 'all', ["id","uuid"]);
        if (nodeClient !== null) return nodeClient;

        nodeClient = new NodeClient();

        try {

            let answer = await nodeClient.connectToWaitlist (nextWaitListObject, index);

            if (answer) nextWaitListObject.socketConnected(nodeClient.socket);
            else nextWaitListObject.socketErrorConnected();

            nextWaitListObject.connecting = false;
            return answer;
        }
        catch (Exception) {
            console.log("Error connecting to new protocol waitlist", Exception)
        }

        nextWaitListObject.connecting = false;
        return false;
    }

    _countConnectingToFallbacks(){

        let count = 0;
        for (let i=0; i<this._connectingQueue.length; i++)
            if (this._connectingQueue[i].isFallback)
                count ++;

        return count;
    }


    _calculateNumberOfConnections() {


        if (process.env.BROWSER) { //browser

            this.connectingMaximum.maximum_fallbacks = consts.SETTINGS.PARAMS.CONNECTIONS.BROWSER.CLIENT.MAXIMUM_CONNECTIONS_IN_BROWSER_WAITLIST_FALLBACK;
            this.connectingMaximum.maximum_waitlist = consts.SETTINGS.PARAMS.CONNECTIONS.BROWSER.CLIENT.MAXIMUM_CONNECTIONS_IN_BROWSER_WAITLIST;

            this.connectingMaximum.minimum_fallbacks = consts.SETTINGS.PARAMS.CONNECTIONS.BROWSER.CLIENT.MIN_SOCKET_CLIENTS_WAITLIST_FALLBACK;
            this.connectingMaximum.minimum_waitlist = consts.SETTINGS.PARAMS.CONNECTIONS.BROWSER.CLIENT.MIN_SOCKET_CLIENTS_WAITLIST;

        }
        else { // server

            let server = NodesList.countNodesByConnectionType(CONNECTION_TYPE.CONNECTION_SERVER_SOCKET);

            this.connectingMaximum.minimum_fallbacks = consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.CLIENT.MIN_SOCKET_CLIENTS_WAITLIST_FALLBACK;
            this.connectingMaximum.minimum_waitlist = consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.CLIENT.MIN_SOCKET_CLIENTS_WAITLIST;

            if (NodeExpress.SSL){
                this.connectingMaximum.maximum_waitlist =  consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.CLIENT.SSL.MAX_SOCKET_CLIENTS_WAITLIST_WHEN_SSL;
                this.connectingMaximum.maximum_fallbacks = consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.CLIENT.SSL.MAX_SOCKET_CLIENTS_WAITLIST_FALLBACK_WHEN_SSL;
            } else {


                if ( server <= 5) {

                    this.connectingMaximum.maximum_fallbacks = consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.CLIENT.MAX_SOCKET_CLIENTS_WAITLIST_FALLBACK;
                    this.connectingMaximum.maximum_waitlist =  consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.CLIENT.MAX_SOCKET_CLIENTS_WAITLIST;

                } else { //people already connected

                    this.connectingMaximum.maximum_fallbacks = consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.CLIENT.SERVER_OPEN.MAX_SOCKET_CLIENTS_WAITLIST_FALLBACK;
                    this.connectingMaximum.maximum_waitlist =  consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.CLIENT.SERVER_OPEN.MAX_SOCKET_CLIENTS_WAITLIST;

                }

            }

        }
    }

}

export default new NodesWaitlistConnecting();