import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesList from 'node/lists/Nodes-List'
import NODES_TYPE from "node/lists/types/Nodes-Type";
import NodeProtocol from 'common/sockets/protocol/extend-socket/Node-Protocol';
import Blockchain from "main-blockchain/Blockchain"

const MAX_WAITLIST_QUEUE_LENGTH = 100;

class NodePropagationProtocol {

    constructor(){


        this._newFullNodesWaitList = {length: 0};  //for key-value
        this._newLightNodesWaitList = {length: 0}; //for key-value


        this._waitlistProccessed = {};

        setTimeout(this._processNewWaitlistInterval.bind(this), 5000 + Math.random()*2000 );

    }

    async _processList(list){

        for (let key in list){

            if (key === "length") continue;
            if (!list.hasOwnProperty(key)) continue;

            let answer = await NodesWaitlist.addNewNodeToWaitlist( key, undefined, list[key].t,  list[key].c, list[key].sock.node.level + 1, list[key].sock );

            if (answer !== null ){

                this._waitlistProccessed[key] = true;

                return;
            }

            delete list[key];
            list.length--;
        }


    }

    async _processNewWaitlistInterval(){

        await this._processList(this._newFullNodesWaitList);
        await this._processList(this._newLightNodesWaitList);


        setTimeout( async ()=>{ await this._processNewWaitlistInterval() } , 1500 + Math.floor( Math.random() * 200 ) );

    }


    initializePropagationProtocol(){

        NodesList.emitter.once("nodes-list/connected", nodeListObject => { this._newNodeConnected( nodeListObject ) } );
        NodesList.emitter.once("nodes-list/disconnected", nodeListObject => { this._nodeDisconnected( nodeListObject) });

        NodesWaitlist.emitter.on("waitlist/new-node", nodeWaitListObject => { this._newNodeConnected( nodeWaitListObject) } );
        NodesWaitlist.emitter.on("waitlist/delete-node", nodeWaitListObject => { this._nodeDisconnected( nodeWaitListObject) });

    }

    initializeSocketForPropagation(socket){

        this.initializeNodesPropagation(socket);

        setTimeout( ()=>{

            socket.node.sendRequest("propagation/request-all-wait-list/full-nodes");
            socket.node.sendRequest("propagation/request-all-wait-list/light-nodes");

        },  3000 + Math.floor( Math.random()*5000));

    }

    initializeNodesSimpleWaitlist(socket){

        if (socket.propagationSet === true) return;
        socket.propagationSet = true;

        socket.on("propagation/simple-waitlist-nodes", async ( data, callback )=>{


            await this._processNodesList(data, socket)

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
                        type = NODES_TYPE.NODE_TERMINAL
                    } else {
                        list = this._newLightNodesWaitList;
                        type = NODES_TYPE.NODE_WEB_PEER;
                    }

                    if (list.length > MAX_WAITLIST_QUEUE_LENGTH)
                        break;


                    for (let i = 0; i < addresses.length; i++){

                        if ( typeof addresses[ i ].a === "string" && list[ addresses[ i ].a ] === undefined && addresses[ i ].a !== "length"){

                            list[ addresses[ i ].a ] = {
                                a: addresses[i].a,
                                t: addresses[i].t,
                                c: addresses[i].c,
                                sock: socket,
                            };

                            list.length++;

                            if (list.length > MAX_WAITLIST_QUEUE_LENGTH)
                                break;

                        }

                    }

                    break;

                    //TODO remove addresses from list

                    // case "disconnected-light-nodes":
                    // case "disconnected-full-nodes":
                    //
                    //     for (let i = 0; i < addresses.length; i++) {
                    //
                    //         let answer = NodesWaitlist._searchNodesWaitlist(addresses[i].addr, undefined, addresses[i].type);
                    //         if (answer.waitlist !== null)
                    //             answer.removeBackedBy(socket.sckAddress);
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

            try{

                let list = NodesWaitlist._waitlistSimpleSSL;

                if (socket.node.protocol.nodeType === NODES_TYPE.NODE_WEB_PEER) //let's send only SSL
                    list = NodesWaitlist._waitlistSimpleSSL;
                else
                    list = NodesWaitlist._waitlistSimple;

                socket.node.sendRequest("propagation/nodes", {"op": "new-full-nodes", addresses: list });

            } catch(exception){
            }

        });

        socket.node.on("propagation/request-all-wait-list/light-nodes", response =>{

            try{

                let list = [];
                for (let i=0; i<NodesWaitlist.waitListFullNodes.length; i++) list.push(NodesWaitlist.waitListLightNodes[i].toJSON());

                socket.node.sendRequest("propagation/nodes", {"op": "new-light-nodes", addresses: list });

            } catch(exception){
            }

        });

        this.initializeNodesSimpleWaitlist(socket);

    }

    _newNodeConnected( nodeWaitListObject ){

        // if (nodeWaitListObject.type === NODES_TYPE.NODE_TERMINAL) NodeProtocol.broadcastRequest("propagation/nodes", {op: "new-full-nodes", addresses: [nodeWaitListObject.toJSON() ]}, undefined, nodeWaitListObject.socket);
        // else if(nodeWaitListObject.type === NODES_TYPE.NODE_WEB_PEER) NodeProtocol.broadcastRequest("propagation/nodes", {op: "new-light-nodes", addresses: [nodeWaitListObject.toJSON() ]}, undefined, nodeWaitListObject.socket);

    }

    _nodeDisconnected(nodeWaitListObject){

        // if (nodeWaitListObject.type === NODES_TYPE.NODE_TERMINAL) NodeProtocol.broadcastRequest("propagation/nodes", {op: "disconnected-full-nodes", addresses: [nodeWaitListObject.toJSON() ]}, undefined, nodeWaitListObject.socket);
        // else if(nodeWaitListObject.type === NODES_TYPE.NODE_WEB_PEER) NodeProtocol.broadcastRequest("propagation/nodes", {op: "disconnected-light-nodes", addresses: [nodeWaitListObject.toJSON() ]} , undefined, nodeWaitListObject.socket );

    }



}

export default new NodePropagationProtocol();
