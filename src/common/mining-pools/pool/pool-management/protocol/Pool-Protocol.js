import consts from 'consts/const_global';
import NodesList from 'node/lists/Nodes-List';
import  Utils from "common/utils/helpers/Utils"
import ed25519 from "common/crypto/ed25519";
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

        NodesList.emitter.on("nodes-list/connected", (result) => {
            this._subscribeMiner(result)
        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeMiner(result)
        });

        for (let i=0; i<NodesList.nodes.length; i++)
            this._subscribeMiner(NodesList.nodes[i]);

        await this.poolConnectedServersProtocol.startPoolConnectedServersProtocol();
        await this.poolConnectedMinersProtocol.startPoolConnectedMinersProtocol();

        this.loaded = true;

        return true;
    }

    _stopPoolProtocol(){

    }

    _subscribeMiner(nodesListObject) {

        let socket = nodesListObject.socket;



    }

    _unsubscribeMiner(nodesListObject) {

        let socket = nodesListObject.socket;

    }


}

export default PoolProtocol;