import ServerPoolData from "./server-pool-data/Server-Pool-Data"
import ServerPoolSettings from "./Server-Pool-Settings"
import ServerPoolProtocol from "./protocol/Server-Pool-Protocol"

import NodeServer from 'node/sockets/node-server/sockets/Node-Server';

class ServerPoolManagement{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.serverPoolData = new ServerPoolData(this );
        this.serverPoolSettings = new ServerPoolSettings(this, );
        this.serverPoolProtocol = new ServerPoolProtocol( this );

        this.serverPoolSettings = new ServerPoolSettings(this);

    }

    async initializeServerPoolManagement(serverPoolFee){

        if ( false === await this.serverPoolData.loadServerPoolsList() )
            throw {message: "loadPoolsList failed"};

        if ( false === await this.serverPoolSettings.initializeServerPoolSettings())
            throw {message: "loadServer didn't work"}

        if (serverPoolFee !== undefined && typeof serverPoolFee === "number")
            this.serverPoolSettings.setServerPoolFee(serverPoolFee);

        this.serverPoolProtocol.startServerPoolProtocol();

        console.info("The url is just your domain: "+ NodeServer.getServerHTTPAddress() );

    }

}

export default ServerPoolManagement;