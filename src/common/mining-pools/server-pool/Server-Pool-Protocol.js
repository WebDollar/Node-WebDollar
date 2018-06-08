import NodesList from 'node/lists/Nodes-List';

class ServerPoolProtocol{

    constructor(blockchain){

        this.blockchain = blockchain;
        this.loaded = false;
    }

    startServerPoolProtocol(){

        if (this.loaded) return;

        NodesList.emitter.on("nodes-list/connected", (result) => {
            this._subscribeSocket(result)
        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeSocket(result)
        });

        for (let i=0; i<NodesList.nodes.length; i++)
            this._subscribeSocket(NodesList.nodes[i]);

        this.loaded = true;

    }

    _subscribeSocket(nodesListObject) {

        let socket = nodesListObject.socket;


        socket.node.on("server-pool/register-pool", (data) => {

        });

    }

    _unsubscribeSocket(nodesListObject) {

        let socket = nodesListObject.socket;

    }

}


export default ServerPoolProtocol;