import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesList from 'node/lists/Nodes-List'
import NODES_TYPE from "node/lists/types/Nodes-Type";
import NodeProtocol from 'common/sockets/protocol/extend-socket/Node-Protocol';
import Blockchain from "main-blockchain/Blockchain"

const MAX_WAITLIST_QUEUE_LENGTH = 100;

class NodePropagationProtocol {

    constructor(){

        //waitlist to be propagated to termination
        this._waitlistSimple = [];
        this._waitlistSimpleSSL = [];

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


        setTimeout( async ()=>{ await this._processNewWaitlistInterval() } , 2000 + Math.floor( Math.random() * 200 ) );

    }


    initializePropagationProtocol(){

        NodesList.emitter.once("nodes-list/connected", nodeListObject => { this._newNodeConnected( nodeListObject ) } );
        NodesList.emitter.once("nodes-list/disconnected", nodeListObject => { this._nodeDisconnected( nodeListObject) });

        NodesWaitlist.emitter.on("waitlist/new-node", nodeWaitListObject => { this._newNodeConnected( nodeWaitListObject) } );
        NodesWaitlist.emitter.on("waitlist/delete-node", nodeWaitListObject => { this._nodeDisconnected( nodeWaitListObject) });

        setInterval( this._recalculateWaitlistSimple.bind(this), 15*1000 + Math.random() * 10*1000 )

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


            await this._processList(data, socket)

            callback("received",{ });

        });

    }

    async _processList(response, socket){

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

        socket.on("propagation/nodes", (data)=>{ this._processList(data, socket )}, );

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


    _recalculateWaitlistSimple(){

        let number = 7 + Math.floor( Math.random()*10 );

        //some from NodesList

        let generateWailistRandomList = (nodes, list, onlySSL = false )=>{

            if (nodes.length === 0) return;

            for (let index = 0; index < number && index < nodes.length; index++){

                let node = nodes[index];
                if (!node.isFallback ){
                    index++;
                    continue;
                }

                let json = node.toJSON();

                let found  = false;
                for (let i=0; i < list.length; i++ )
                    if ( list[i].a === json.a ){
                        found = true;
                        break;
                    }

                if ( !found && (!onlySSL || onlySSL && node.sckAddresses[0].SSL === true))
                    list.push(json);

                index++;
            }

        };


        this._waitlistSimple = [];
        generateWailistRandomList( NodesWaitlist.waitListFullNodes, this._waitlistSimple);

        this._waitlistSimpleSSL = [];
        generateWailistRandomList( NodesWaitlist.waitListFullNodes, this._waitlistSimpleSSL, true);

    }

    /**
     * Only supports simple Socket
     * @param socket
     * @param nodeType
     * @param disconnectSocket
     * @returns {Promise.<void>}
     */

    async propagateWaitlistSimple(socket, nodeType, disconnectSocket = true){

        if ( socket === undefined ) return;

        if (socket.emit === undefined) console.warn("socket.emit is not supported");

        let list;

        if (nodeType === NODES_TYPE.NODE_WEB_PEER) //let's send only SSL
            list = this._waitlistSimpleSSL;
        else
            list = this._waitlistSimple;

        let timeout;
        if (disconnectSocket)
            timeout = setTimeout( ()=>{ socket.disconnect() }, 7000 + Math.floor(Math.random() * 5*1000));

        socket.emit( "propagation/simple-waitlist-nodes", { op: "new-full-nodes", addresses: list }, (data)=>{

            if ( disconnectSocket )
                socket.disconnect();

            clearTimeout(timeout);

        });

        await Blockchain.blockchain.sleep(20);

    }

}

export default new NodePropagationProtocol();
