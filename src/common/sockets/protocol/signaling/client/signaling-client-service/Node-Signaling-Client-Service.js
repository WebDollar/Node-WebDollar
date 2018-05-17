import consts from 'consts/const_global'
import SignalingClientList from "../signaling-client-list/signaling-client-list"
import NodesList from 'node/lists/Nodes-List'

class NodeSignalingClientService {

    constructor(){

        this.serversList = [];

        NodesList.emitter.on("nodes-list/disconnected", async (nodesListObject) => {
            await this._desinitializeNode(nodesListObject.socket);
        });

    }

    _desinitializeNode(socket){

        for (let i=0; i<this.serversList.length; i++)
            if ( this.serversList[i].socket.node.sckAddress.uuid === socket.node.sckAddress.uuid ){
                this.serversList[i].socket = undefined;
                this.serversList.splice(i,1);
                return;
            }

    }


    subscribeSignalingServer(socket){

        this.serversList.push({
            socket: socket
        });

        this._askSignalingServer(socket);
    }

    askRandomSignalingServerToConnect(){

        let index = Math.floor ( Math.random () * this.serversList.length );

        this._askSignalingServer(this.serversList[index].socket);

    }

    _askSignalingServer(socket){
        socket.node.sendRequest("signals/server/register/accept-web-peer-connections", {acceptWebPeers : SignalingClientList.connected.length < consts.SETTINGS.PARAMS.CONNECTIONS.BROWSER.WEBRTC.MAXIMUM_CONNECTIONS } );
    }

}

export default new NodeSignalingClientService();