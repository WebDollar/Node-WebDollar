import NodesList from 'node/lists/Nodes-List';
import PoolConnectedServerProtocol from "./connected-servers/Pool-Connected-Servers-Protocol"
import PoolConnectedMinersProtocol from "./connected-miners/Pool-Connected-Miners-Protocol"

class PoolProtocol {

    constructor(poolManagement) {

        this.poolManagement = poolManagement;
        this.loaded = false;

        this.poolConnectedServersProtocol = new PoolConnectedServerProtocol(this.poolManagement);
        this.poolConnectedMinersProtocol = new PoolConnectedMinersProtocol(this.poolManagement);

    }

    async _startPoolProtocol(){

        if (this.loaded) return true;

        this.loaded = true;


        for (let i=0; i<NodesList.nodes.length; i++)
            this._subscribePool(NodesList.nodes[i]);

        NodesList.emitter.on("nodes-list/connected", (result) => {
            this._subscribePool(result)
        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribePool(result)
        });


        await this.poolConnectedServersProtocol.startPoolConnectedServersProtocol();
        await this.poolConnectedMinersProtocol.startPoolConnectedMinersProtocol();

        return true;
    }

    _stopPoolProtocol(){

    }

    _subscribePool(nodesListObject) {

        let socket = nodesListObject.socket;

    }

    _unsubscribePool(nodesListObject) {

        let socket = nodesListObject.socket;

    }


}

export default PoolProtocol;