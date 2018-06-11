import ServerPoolData from "./server-pool-data/Server-Pool-Data"

class ServerPoolManagement{

    constructor(blockchain, serverPoolFee = 0.01){

        this.blockchain = blockchain;
        this.fee = serverPoolFee;

        this.serverPoolData = new ServerPoolData(this );

    }

    async initializeServerPoolManagement(){

        if ( false === await this.serverPoolData.loadPoolsList() )
            throw {message: "loadPoolsList failed"}

    }

}

export default ServerPoolManagement;