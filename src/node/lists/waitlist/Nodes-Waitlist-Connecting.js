import NodesWaitlist from "./Nodes-Waitlist";
import NodeClient from 'node/sockets/node-clients/socket/Node-Client'
import consts from 'consts/const_global'
import NodesList from 'node/lists/Nodes-List'
import CONNECTION_TYPE from "../types/Connections-Type";
import Blockchain from "main-blockchain/Blockchain";
import AGENT_STATUS from "common/blockchain/interface-blockchain/agents/Agent-Status";
import VersionCheckerHelper from "common/utils/helpers/Version-Checker-Helper"
import NODES_TYPE from "node/lists/types/Nodes-Type"

class NodesWaitlistConnecting {

    constructor(){

        this.started = false;
        this._connectingQueue = [];


        //mobiles usually use mobile internet are they mostly block non 80 blocks
        this._connectedOnlyTo80 = false;

        if (VersionCheckerHelper.detectMobile())
            this._connectedOnlyTo80 = true;

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
            if ( Blockchain.blockchain.agent.status === AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED && !NodesWaitlist.waitListFullNodes[i].isFallback)  continue;
            if ( Blockchain.blockchain.agent.status !== AGENT_STATUS.AGENT_STATUS_NOT_SYNCHRONIZED && NodesWaitlist.waitListFullNodes[i].isFallback)  continue;

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

        let count = this._connectingQueue.length + NodesList.countNodesByConnectionType(CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET, nextWaitListObject.isFallback);

        if ( process.env.BROWSER ){ //browser

            if (nextWaitListObject.isFallback && count >= consts.SETTINGS.PARAMS.CONNECTIONS.BROWSER.CLIENT.MAXIMUM_CONNECTIONS_IN_BROWSER_WAITLIST_FALLBACK) return;
            else if ( !nextWaitListObject.isFallback && count >= consts.SETTINGS.PARAMS.CONNECTIONS.BROWSER.CLIENT.MAXIMUM_CONNECTIONS_IN_BROWSER_WAITLIST) return;

        } else {

            if (nextWaitListObject.isFallback && count >= consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.CLIENT.MAXIMUM_CONNECTIONS_IN_TERMINAL_WAITLIST_FALLBACK) return;
            else if ( !nextWaitListObject.isFallback && count >= consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.CLIENT.MAXIMUM_CONNECTIONS_IN_BROWSER_WAITLIST) return;

        }

        if (Blockchain.Agent.light && Blockchain.Agent.status === AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED_SLAVES)
            return;

        //connect only to TERMINAL NODES
        if ( nextWaitListObject.type === NODES_TYPE.NODE_TERMINAL) {

            if (nextWaitListObject.checkLastTimeChecked(consts.SETTINGS.PARAMS.WAITLIST.TRY_RECONNECT_AGAIN) && nextWaitListObject.blocked === false &&
                nextWaitListObject.connecting === false && nextWaitListObject.checkIsConnected() === null) {

                nextWaitListObject.blocked = true;
                this._connectingQueue.push(nextWaitListObject);

                this._connectNowToNewNode(nextWaitListObject).then((connected) => {

                    for (let i=0; i<this._connectingQueue.length; i++)
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

            let answer = await nodeClient.connectTo (nextWaitListObject.sckAddresses[index], undefined, nextWaitListObject.level+1);

            if (answer) nextWaitListObject.socketConnected(nodeClient);
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


}

export default new NodesWaitlistConnecting();