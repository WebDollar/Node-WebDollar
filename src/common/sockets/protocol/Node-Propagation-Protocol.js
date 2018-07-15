import NODES_CONSENSUS_TYPE from "node/lists/types/Node-Consensus-Type";

import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesList from 'node/lists/Nodes-List'
import NODE_TYPE from "node/lists/types/Node-Type";
import NodeProtocol from 'common/sockets/protocol/extend-socket/Node-Protocol';
import Blockchain from "main-blockchain/Blockchain"
import NodePropagationList from 'common/sockets/protocol/Node-Propagation-List'

const MAX_WAITLIST_QUEUE_LENGTH = 1000;
const DOWNLOAD_WAITLIST_COUNT = 20;

class NodePropagationProtocol {

    constructor(){


        this._newFullNodesWaitList = {length: 0};  //for key-value
        this._newLightNodesWaitList = {length: 0}; //for key-value


        this._waitlistProccessed = {};

        setTimeout(this._processNewWaitlistInterval.bind(this), 5000 + Math.random()*2000 );

    }

    async _processList(list, nodeType){

        for (let key in list){

            if (key === "length") continue;
            if (!list.hasOwnProperty(key)) continue;

            let answer = await NodesWaitlist.addNewNodeToWaitlist( key, undefined, list[key].t, list[key].ct||NODES_CONSENSUS_TYPE.NODE_CONSENSUS_PEER,  list[key].c, list[key].sock.node.level + 1, list[key].sock );

            //downloading the next elements
            if (list[key].next !== undefined && list[key].next > 0)
                list[key].sock.node.sendRequest( (nodeType === NODE_TYPE.NODE_TERMINAL ? "propagation/request-all-wait-list/full-nodes" : "propagation/request-all-wait-list/light-nodes"), { index: list[key].next, count: DOWNLOAD_WAITLIST_COUNT });

            delete list[key];
            list.length--;

            if (answer.result ){
                this._waitlistProccessed[key] = true;
                return;
            }

        }


    }

    async _processNewWaitlistInterval(){

        await this._processList(this._newFullNodesWaitList, NODE_TYPE.NODE_TERMINAL);
        await this._processList(this._newLightNodesWaitList, NODE_TYPE.NODE_WEB_PEER);


        setTimeout( async ()=>{ await this._processNewWaitlistInterval() } , 1500 + Math.floor( Math.random() * 200 ) );

    }


    initializePropagationProtocol(){

        NodesList.emitter.once("nodes-list/connected", nodeListObject => { this._newNodeConnected( nodeListObject ) } );
        NodesList.emitter.once("nodes-list/disconnected", nodeListObject => { this._nodeDisconnected( nodeListObject) });

        NodesWaitlist.emitter.on("waitlist/new-node", nodeWaitListObject => { this._newNodeConnected( nodeWaitListObject) } );
        NodesWaitlist.emitter.on("waitlist/delete-node", nodeWaitListObject => { this._nodeDisconnected( nodeWaitListObject) });

    }

    initializeSocketForPropagation(socket){

        //avoiding download the list from
        if ( [NODES_CONSENSUS_TYPE.NODE_CONSENSUS_MINER_POOL].indexOf( socket.node.protocol.nodeConsensusType ) === 0 )
            return;


        this.initializeNodesPropagation(socket);


        setTimeout( ()=>{

            socket.node.sendRequest("propagation/request-all-wait-list/full-nodes", { index: 0, count: DOWNLOAD_WAITLIST_COUNT });
            socket.node.sendRequest("propagation/request-all-wait-list/light-nodes", { index:0, count: DOWNLOAD_WAITLIST_COUNT });

        },  3000 + Math.floor( Math.random()*5000));

    }

    initializeNodesSimpleWaitlist(socket){

        if (socket.propagationSet === true) return;
        socket.propagationSet = true;

        socket.on("propagation/simple-waitlist-nodes", async ( data, callback )=>{


            await this._processNodesList(data, socket);

            callback("received",{ });

        });

    }

    async _processNodesList(response, socket){

        try {

            let addresses = response.addresses || [];
            if (typeof addresses === "string") addresses = [addresses];

            if (!Array.isArray(addresses)) throw { message: "addresses is not an array" };

            if (addresses.length > 50) addresses.splice(50); //only the first 50 nodes

            let op = response.op || '';

            switch (op) {

                case "new-full-nodes":
                case "new-light-nodes":

                    let list, type;

                    if (op === "new-full-nodes") {
                        list = this._newFullNodesWaitList;
                        type = NODE_TYPE.NODE_TERMINAL
                    } else {
                        list = this._newLightNodesWaitList;
                        type = NODE_TYPE.NODE_WEB_PEER;
                    }

                    if (list.length > MAX_WAITLIST_QUEUE_LENGTH)
                        break;

                    let lastWaitlist = undefined;

                    for (let i = 0; i < addresses.length; i++){

                        if ( typeof addresses[ i ].a === "string" && list[ addresses[ i ].a ] === undefined && addresses[ i ].a !== "length"){

                            list[ addresses[ i ].a ] = {
                                a: addresses[i].a,
                                t: addresses[i].t,
                                c: addresses[i].c,
                                sock: socket,
                            };

                            lastWaitlist = list[ addresses[ i ].a ];

                            list.length++;

                            if (list.length > MAX_WAITLIST_QUEUE_LENGTH)
                                break;

                        }

                    }

                    if (lastWaitlist !== undefined && response.next !== undefined && response.next > 0  )
                        lastWaitlist.next = response.next ;

                    break;

                    //TODO remove addresses from list

                    case "disconnected-light-nodes":
                case "disconnected-full-nodes":

                    //     for (let i = 0; i < addresses.length; i++) {
                    //
                    //         let answer = NodesWaitlist._searchNodesWaitlist(addresses[i].addr, undefined, addresses[i].nodeType);
                    //         if (answer.waitlist !== null)
                    //             answer.removeBackedBy(socket.node.sckAddress);
                    //
                    //         if (i%20 === 0)
                    //             await Blockchain.blockchain.sleep(50);
                    //
                    //     }

                    break;

                default:
                    throw {message: "Op is invalid"};

            }

        }
        catch (exception){

        }

    }

    initializeNodesPropagation(socket){

        socket.on("propagation/nodes", async (data)=>{ await this._processNodesList(data, socket )}, );

        socket.node.on("propagation/request-all-wait-list/full-nodes", response =>{

            let answer = this._getWaitlist( response, NodesWaitlist.waitListFullNodes );

            if (answer !== null && answer.list.length > 0)
                socket.node.sendRequest("propagation/nodes", {"op": "new-full-nodes", addresses: answer.list, next: answer.next});

        });

        socket.node.on("propagation/request-all-wait-list/light-nodes", response =>{

            let answer = this._getWaitlist( response, NodesWaitlist.waitListFullNodes );

            if (answer !== null && answer.list.length > 0)
                socket.node.sendRequest("propagation/nodes", {"op": "new-light-nodes", addresses: answer.list, next: answer.next});

        });

        this.initializeNodesSimpleWaitlist(socket);

    }

    _getWaitlist(response, list){

        try {
            let index = response.index || 0;
            let count = response.count || 50;
            count = Math.min(count, 50);
            count = Math.max(count, 5);

            let answer = [];
            for (let i = index * count; i < (index + 1) * count && i < list.length; i++)
                answer.push(list[i].toJSON());

            return {list: answer, next:  ( (index+1) * count < list.length ) ? (index+1) : 0 }

        } catch (exception){

            return null;
        }

    }

    _newNodeConnected( nodeWaitListObject ){

        // if (nodeWaitListObject.nodeType === NODE_TYPE.NODE_TERMINAL) NodeProtocol.broadcastRequest("propagation/nodes", {op: "new-full-nodes", addresses: [nodeWaitListObject.toJSON() ]}, undefined, nodeWaitListObject.socket);
        // else if(nodeWaitListObject.nodeType === NODE_TYPE.NODE_WEB_PEER) NodeProtocol.broadcastRequest("propagation/nodes", {op: "new-light-nodes", addresses: [nodeWaitListObject.toJSON() ]}, undefined, nodeWaitListObject.socket);

    }

    _nodeDisconnected(nodeWaitListObject){

        // if (nodeWaitListObject.nodeType === NODE_TYPE.NODE_TERMINAL) NodeProtocol.broadcastRequest("propagation/nodes", {op: "disconnected-full-nodes", addresses: [nodeWaitListObject.toJSON() ]}, undefined, nodeWaitListObject.socket);
        // else if(nodeWaitListObject.nodeType === NODE_TYPE.NODE_WEB_PEER) NodeProtocol.broadcastRequest("propagation/nodes", {op: "disconnected-light-nodes", addresses: [nodeWaitListObject.toJSON() ]} , undefined, nodeWaitListObject.socket );

    }



}

export default new NodePropagationProtocol();
