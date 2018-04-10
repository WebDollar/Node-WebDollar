import NodesWaitlist from 'node/lists/waitlist/nodes-waitlist'
import NodeProtocol from 'common/sockets/protocol/node-protocol';
import NodesList from 'node/lists/nodes-list'

class NodePropagationProtocol {

    constructor(){
        console.log("NodePropagation constructor");
    }


    initializeSocketForPropagation(socket){

        this.initializeNodesPropagation(socket);

        socket.node.sendRequestWaitOnce("propagation/request-all-wait-list-nodes");

        NodesList.emitter.on("nodes-list/connected", nodeListObject => { this._newNodeConnected(socket, nodeListObject) } );
        NodesList.emitter.on("nodes-list/disconnected", nodeListObject => { this._nodeDisconnected(socket, nodeListObject) });

        NodesWaitlist.emitter.on("waitlist/new-node", nodeWaitListObject => { this._newNodeConnected(socket, nodeWaitListObject) } );
        NodesWaitlist.emitter.on("waitlist/delete-node", nodeWaitListObject => { this._nodeDisconnected(socket, nodeWaitListObject) });

    }

    initializeNodesPropagation(socket){

        socket.node.on("propagation/request-all-wait-list-nodes", response =>{

            try{

                let list = [];

                for (let i=0; i<NodesList.nodes.length; i++)
                    list.push(NodesList.nodes[i].toJSON());

                for (let i=0; i<NodesWaitlist.waitlist.length; i++)
                    list.push(NodesWaitlist.waitlist[i].toJSON());

                socket.node.sendRequest("propagation/nodes", {"op": "new-nodes", addresses: list });

            } catch(exception){

            }

        });

        socket.node.on("propagation/nodes", response => {

            try {
                console.log("NodePropagation", socket.node.sckAddress.getAddress());
                console.log("NodePropagation", response);

                let addresses = response.addresses || [];
                if (typeof addresses === "string") addresses = [addresses];

                if (!Array.isArray(addresses)) throw {message: "addresses is not an array"};

                let op = response.op || '';
                switch (op) {

                    case "new-nodes":

                        for (let i = 0; i < addresses.length; i++)
                            NodesWaitlist.addNewNodeToWaitlist(addresses[i].addr, addresses[i].port, addresses[i].type, addresses[i].connected, socket.node.level + 1, socket );

                        break;

                    case "deleted-nodes":

                        for (let i = 0; i < addresses.length; i++)
                            NodesWaitlist.removedWaitListElement( addresses[i].addr, addresses[i].port, socket );

                        break;

                    default:
                        throw {message: "Op is invalid"};

                }

            }
            catch (exception){

            }

        });
    }

    _newNodeConnected(socket, address){
        socket.node.sendRequest("propagation/nodes", {op: "new-nodes", addresses: [address.toJSON() ]},)
    }

    _nodeDisconnected(socket, address){
        socket.node.sendRequest("propagation/nodes", {op: "deleted-nodes", addresses: [address.toJSON() ]},)
    }

}

export default new NodePropagationProtocol();
