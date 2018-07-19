import NodesList from 'node/lists/Nodes-List'
import NodeSignalingServerWaitlistObject from "./Node-Signaling-Server-Waitlist-Object"
import NodeSignalingServerProtocol from "./../Node-Signaling-Server-Protocol"
import SignalingServerRoomList from '../signaling-server-room/Signaling-Server-Room-List'
import Utils from "common/utils/helpers/Utils"

class NodeSignalingServerService{

    constructor(){

        this.waitlist = [];
        this.started = false;

        NodesList.emitter.on("nodes-list/disconnected", async (nodesListObject) => {
            await this._desinitializeNode(nodesListObject.socket);
        });

    }

    _desinitializeNode(socket){

        for (let i=this.waitlist.length-1; i>=0; i--)
            if ( this.waitlist[i].socket.node.sckAddress.matchAddress(socket.node.sckAddress, ["uuid"] ) ){
                this.waitlist.splice(i,1);
                return;
            }

    }

    async registerSocketForSignaling(socket, acceptWebPeers = true){

        let waitlistObject = this.searchNodeSignalingServerWaitlist(socket);

        if (waitlistObject === null) {
            waitlistObject = new NodeSignalingServerWaitlistObject(socket, acceptWebPeers, );
            this.waitlist.push( waitlistObject )
        }

        return waitlistObject;
    }

    startConnectingWebPeers(){

        if ( this.started === true )
            return;

        this.started = true;

        this._connectWebPeers();
    }

    findNodeSignalingServerWaitlist(socket){
        for (let i=0; i<this.waitlist.length; i++)
            if (this.waitlist[i].socket.node.sckAddress.matchAddress(socket.node.sckAddress, ["uuid"])){
                return i;
            }
        return -1;
    }

    searchNodeSignalingServerWaitlist(socket){
        let pos = this.findNodeSignalingServerWaitlist(socket);
        if (pos !== -1) return this.waitlist[pos];

        return null;
    }

    async _connectWebPeers(){

        let count = 0;

        //mixing users
        for (let i = 0; i < this.waitlist.length; i++)
            if (this.waitlist[i].acceptWebPeers)

                for (let j = i+1; j < this.waitlist.length; j++)
                    if (this.waitlist[j].acceptWebPeers) {


                        // Step 0 , finding two different clients
                        // clients are already already with socket

                        //shuffling them, the sockets to change the orders
                        let client1, client2 = null;

                        if (Math.random() > 0.5) {

                            client1 = this.waitlist[i];
                            client2 = this.waitlist[j];

                        } else {
                            client1 = this.waitlist[j];
                            client2 = this.waitlist[i];
                        }

                        NodeSignalingServerProtocol.connectWebPeer( client1.socket, client2.socket );

                        if (count % 100 === 0)
                            await Utils.sleep(20);

                    }

        setTimeout(this._connectWebPeers.bind(this), 2000);
    }


}

export default new NodeSignalingServerService();