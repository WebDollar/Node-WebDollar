import NodesList from 'node/lists/Nodes-List';
import ServerPoolConnectedPoolsProtocol from "./connected-pools/Server-Pool-Connected-Pools-Protocol";
import ServerPoolConnectedMinersProtocol from "./connected-miners/Server-Pool-Connected-Miners-Protocol";

class ServerPoolProtocol{

    constructor(serverPoolManagement, blockchain){

        this.serverPoolManagement = serverPoolManagement;
        this.blockchain = blockchain;
        this.loaded = false;

        this.serverPoolConnectedPoolsProtocol = new ServerPoolConnectedPoolsProtocol(serverPoolManagement, blockchain);
        this.serverPoolConnectedMinersProtocol = new ServerPoolConnectedMinersProtocol(serverPoolManagement, blockchain);

    }

    _startServerPoolProtocol(){

        if (this.loaded) return;

        NodesList.emitter.on("nodes-list/connected", (result) => {
            this._subscribeSocket(result)
        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeSocket(result)
        });

        for (let i=0; i<NodesList.nodes.length; i++)
            this._subscribeSocket(NodesList.nodes[i]);

        this.serverPoolConnectedPoolsProtocol.startServerPoolConnectedPoolsProtocol();
        this.serverPoolConnectedMinersProtocol.startServerPoolConnectedPoolsProtocol();

        this.loaded = true;

    }

    _stopServerPoolProtocol(){

    }

    _subscribeSocket(nodesListObject) {

        let socket = nodesListObject.socket;

    }

    _unsubscribeSocket(nodesListObject) {

        let socket = nodesListObject.socket;

    }

}


export default ServerPoolProtocol;