class PoolProtocolForServer{

    constructor(poolManagement){

        this.poolManagement = poolManagement;

        this.serversConnected = [];

    }

    async registerPoolToServerPool(socket) {

        let answer = await socket.sendRequestWaitOnce("server-pool/register-pool", {
            poolName: this.poolManagement.poolSettings.poolName,
            poolFee: this.poolManagement.poolSettings.poolFee,
            poolWebsite: this.poolManagement.poolSettings.poolWebsite,
            poolPublicKey: this.poolManagement.poolSettings.poolPublicKey,
        });

        if (answer !== null) {

        }

    }

    _addServerConnected(){

    }

    _deleteServerConnected(){

    }

}

export default PoolProtocolForServer;