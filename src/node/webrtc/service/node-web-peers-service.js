import NodeWebPeersDiscoveryService from 'node/webrtc/service/discovery/node-web-peers-discovery-service'
import Blockchain from "main-blockchain/Blockchain"


class NodeWebPeersService {

    constructor(){
        console.log("NodeWebPeersService constructor");
    }


    startService(){

        //after
        Blockchain.onLoaded.then((answer)=>{

            // in case the Blockchain was not loaded, I will not be interested in transactions

            NodeWebPeersDiscoveryService.startDiscovery();

        });

    }


}

export default new NodeWebPeersService();