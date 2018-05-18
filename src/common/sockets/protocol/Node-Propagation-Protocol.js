import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NodesList from 'node/lists/Nodes-List'
import NODES_TYPE from "node/lists/types/Nodes-Type";
import NodeProtocol from 'common/sockets/protocol/extend-socket/Node-Protocol';
import Blockchain from "main-blockchain/Blockchain"

class NodePropagationProtocol {

    constructor(){

        //waitlist to be propagated to termination
        this._waitlistSimple = [];
        this._waitlistSimpleSSL = [];

        this._newFullNodesWaitList = [];
        this._newLightNodesWaitList = [];

        setTimeout(this._processNewWaitlistInterval.bind(this), 5000 + Math.random()*2000 );

    }

    async _processList(list){

        for (let i=0; i<list.length; i++) {

            let waitlist = null;

            while (waitlist === null && list.length > 0) {

                let index = 0;
                let newNode = list[index];

                waitlist = await NodesWaitlist.addNewNodeToWaitlist( newNode.address.addr, undefined, newNode.address.type,  newNode.address.connected, newNode.socket.node.level + 1, newNode.socket);

                list.splice(index, 1);

                return;
            }

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

    initializeNodesPropagation(socket){

        socket.node.on("propagation/request-all-wait-list/full-nodes", response =>{

            try{

                let list = [];
                for (let i=0; i<NodesWaitlist.waitListFullNodes.length; i++) {

                    if (socket.node.protocol.nodeType === NODES_TYPE.NODE_WEB_PEER && !NodesWaitlist.waitListFullNodes[i].sckAddresses[0].SSL) //let's send only SSL
                        continue;

                    list.push(NodesWaitlist.waitListFullNodes[i].toJSON());
                }

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

        socket.node.on("propagation/nodes", async (response) => {

            try {

                let addresses = response.addresses || [];
                if (typeof addresses === "string") addresses = [addresses];

                if (!Array.isArray(addresses)) throw {message: "addresses is not an array"};

                let op = response.op || '';

                switch (op) {

                    case "new-full-nodes":
                    case "new-light-nodes":

                        let list, type;

                        if(op === "new-full-nodes") {
                            list = this._newFullNodesWaitList;
                            type = NODES_TYPE.NODE_TERMINAL
                        } else {
                            list = this._newLightNodesWaitList;
                            type = NODES_TYPE.NODE_WEB_PEER;
                        }

                        for (let i = 0; i < addresses.length; i++)
                            if(addresses[i].type === type) {

                                let found = false;
                                for (let j = 0; j < list.length; j++)
                                    if (list[j].addr === addresses[i].addr) {
                                        found = true;
                                        break;
                                    }

                                if (i%20 === 0)
                                    await Blockchain.blockchain.sleep(50);

                                if (!found)
                                    list.push({address: addresses[i], socket: socket});
                            }


                        break;

                    case "disconnected-light-nodes":
                    case "disconnected-full-nodes":

                        for (let i = 0; i < addresses.length; i++) {

                            let answer = NodesWaitlist._searchNodesWaitlist(addresses[i].addr, undefined, addresses[i].type);
                            if (answer.waitlist !== null)
                                answer.removeBackedBy(socket.sckAddress);

                            if (i%20 === 0)
                                await Blockchain.blockchain.sleep(50);

                        }

                        break;

                    default:
                        throw {message: "Op is invalid"};

                }

            }
            catch (exception){

            }

        });
    }

    _newNodeConnected( nodeWaitListObject ){

        if (nodeWaitListObject.type === NODES_TYPE.NODE_TERMINAL) NodeProtocol.broadcastRequest("propagation/nodes", {op: "new-full-nodes", addresses: [nodeWaitListObject.toJSON() ]}, undefined, nodeWaitListObject.socket);
        else if(nodeWaitListObject.type === NODES_TYPE.NODE_WEB_PEER) NodeProtocol.broadcastRequest("propagation/nodes", {op: "new-light-nodes", addresses: [nodeWaitListObject.toJSON() ]}, undefined, nodeWaitListObject.socket);

    }

    _nodeDisconnected(nodeWaitListObject){

        if (nodeWaitListObject.type === NODES_TYPE.NODE_TERMINAL) NodeProtocol.broadcastRequest("propagation/nodes", {op: "disconnected-full-nodes", addresses: [nodeWaitListObject.toJSON() ]}, undefined, nodeWaitListObject.socket);
        else if(nodeWaitListObject.type === NODES_TYPE.NODE_WEB_PEER) NodeProtocol.broadcastRequest("propagation/nodes", {op: "disconnected-light-nodes", addresses: [nodeWaitListObject.toJSON() ]} , undefined, nodeWaitListObject.socket );

    }


    _recalculateWaitlistSimple(){

        let number = 5 + Math.floor( Math.random()*10 );

        //some from NodesList

        let generateWailistRandomList = (nodes, list, onlySSL = false )=>{

            if (nodes.length === 0) return;

            for (let index =0; index < number && index < nodes.length; index++){

                let node = nodes[index];
                if (!node.isFallback ){
                    index++;
                    continue;
                }

                let json = node.toJSON();

                let found  = false;
                for (let i=0; i < list.length; i++ )
                    if (list[i].addr === json.addr){
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

    async propagateWaitlistSimple(socket, disconnectSocket = true){

        if (socket === undefined || socket.node === undefined ) return;

        if (socket.emit === undefined) console.warn("socket.emit is not supported");

        let list = this._waitlistSimple;

        if (socket.node.protocol.nodeType === NODES_TYPE.NODE_WEB_PEER) //let's send only SSL
            list = this._waitlistSimpleSSL;

        socket.emit( "propagation/nodes", { op: "new-full-nodes", addresses: list } );

        await Blockchain.blockchain.sleep(50);

        if (disconnectSocket){
            setTimeout(()=>{
                socket.disconnect();
            }, 3000);
        }

    }

}

export default new NodePropagationProtocol();
