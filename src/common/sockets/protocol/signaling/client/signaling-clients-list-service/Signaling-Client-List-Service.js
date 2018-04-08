import consts from 'consts/const_global'
import NodesList from 'node/lists/nodes-list'
const uuid = require('uuid');

const TIME_TO_CONNECT = 4 * 1000;

class SignalingClientListService{

    constructor(){

        this.signalingServers = [];
        this.pending = [];


        NodesList.emitter.on("nodes-list/disconnected", async (nodesListObject) => {
            await this._desinitializeNode(nodesListObject);
        });

        setInterval(async ()=>{

            await this._connectToWebPeers();

        }, 2000);

        this._connectToWebPeers();
    }



    async _connectToWebPeers(){

        let remainingConnections = consts.SETTINGS.PARAMS.CONNECTIONS.WEBRTC.MAXIMUM_CONNECTIONS - NodesList.countNodes("webpeer");
        if (remainingConnections <= 0) return false; //I am already done;

        let index = Math.floor( Math.random()*this.signalingServers.length );

        if (index < 0 || index > this.signalingServers.length-1 || this.signalingServers[index] === undefined) return false;

        let answer =  await this.signalingServers[index].socket.node.sendRequest( "signals/server/register/accept-web-peer-connections", { connectionUUID: uuid.v4(), timeLeft: TIME_TO_CONNECT } );

        if (answer.result === true){



        } else {

        }

    }


    subscribeSignalingServer(socket ){

        if (socket.node.type === "client" || socket.node.type === "webpeer") {
            this.signalingServers.push({
                socket: socket,
            })
        }

    }


    _desinitializeNode(nodesListObject){

        for (let i=0; i<this.signalingServers.length; i++)
            if ( this.signalingServers[i] === nodesListObject.socket ){
                this.signalingServers.splice(i,1);
                return;
            }

    }

}

export default new SignalingClientListService();