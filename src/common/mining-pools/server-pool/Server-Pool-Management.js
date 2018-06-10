class ServerPoolManagement{

    constructor(blockchain){

        this.blockchain = blockchain;

    }

    async initializeServerPoolManagement(){
        await this.minerPoolSettings.initializeMinerPoolSettings();
    }

}

export default ServerPoolManagement;