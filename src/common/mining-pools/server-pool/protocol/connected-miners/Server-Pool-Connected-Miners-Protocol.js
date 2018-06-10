import NodesList from 'node/lists/Nodes-List';

class ServerPoolConnectedMinersProtocol{


    constructor(serverPoolManagement){

        this.serverPoolManagement = serverPoolManagement;
        this.loaded = false;

    }

    startServerPoolConnectedPoolsProtocol(){

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


        socket.node.on("server-pool/register-miner", (data) => {

            try {

                if ( typeof data.poolName !== "string" || data.poolName.length <  5) throw {message: "poolName is not correct"};
                if ( typeof data.poolFee !== "number" || data.poolFee < 0 || data.poolFee > 100) throw { message: "poolFee is not correct" };
                if ( typeof data.poolWebsite !== "string" || data.poolWebsite.length <  5) throw { message: "poolWebsite is not correct" };
                if (!Buffer.isBuffer(data.poolPublicKey) || data.poolPublicKey.length < 10) throw { message: "poolPublicKey is not correct" };


            } catch (exception){

                socket.node.emit("server-pool/register-pool"+"/answer", {result: false} );

            }

        });

    }

    _unsubscribeSocket(nodesListObject) {

        let socket = nodesListObject.socket;

    }

}

export default ServerPoolConnectedMinersProtocol;