import ServerPoolData from "./server-pool-data/Server-Pool-Data"
import ServerPoolSettings from "./Server-Pool-Settings"

class ServerPoolManagement{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.serverPoolData = new ServerPoolData(this );
        this.serverPoolSettings = new ServerPoolSettings(this);

    }

    async initializeServerPoolManagement(serverPoolFee){

        if ( false === await this.serverPoolData.loadPoolsList() )
            throw {message: "loadPoolsList failed"};

        await this.serverPoolSettings.initializeServerPoolSettings();

        if (serverPoolFee !== undefined && typeof serverPoolFee === "number")
            this.serverPoolSettings.setServerPoolFee(serverPoolFee);


    }

}

export default ServerPoolManagement;