import consts from 'consts/const_global'
import NodesList from 'node/lists/nodes-list'

class SignalingClientListService{

    constructor(){
        this.list = [];

    }

    subscribeClientToSignalingServer(socket ){

        if (socket.node.type === "client" || socket.node.type === "webpeer") {
            this.list.push({
                socket: socket,
            })
        }

        this._askForWebPeers();

    }


    async _askForWebPeers(){

        let remainingConnections = consts.SETTINGS.PARAMS.CONNECTIONS.WEBRTC.MAXIMUM_CONNECTIONS - NodesList.countNodes("webpeer");
        if (remainingConnections <= 0) return false; //I am already done;

        let index = Math.floor( Math.random()*this.list.length );

        if (index < 0 || index > this.list.length-1 || this.list[index] === undefined) return false;

        let answer =  await this.list[index].socket.node.sendRequest("signals/server/register/accept-web-peer-connections", { connections: 1 });

        if (answer.result === true){

        } else {

        }

    }

}

export default new SignalingClientListService();