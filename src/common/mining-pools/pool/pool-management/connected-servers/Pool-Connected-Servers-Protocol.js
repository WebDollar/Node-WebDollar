import NodesList from 'node/lists/Nodes-List';
import PoolConnectedServer from "./Pool-Connected-Server";

class PoolConnectedServersProtocol{

    constructor(poolManagement){

        this.poolManagement = poolManagement;

        this.connectedServers = [];

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._deleteConnectedServer(result.socket)
        });

    }

    async registerPoolToServerPool(socket) {

        let answer = await socket.sendRequestWaitOnce("server-pool/register-pool", {
            poolName: this.poolManagement.poolSettings.poolName,
            poolFee: this.poolManagement.poolSettings.poolFee,
            poolWebsite: this.poolManagement.poolSettings.poolWebsite,
            poolPublicKey: this.poolManagement.poolSettings.poolPublicKey,
        });

        if (answer !== null && answer.result === true && typeof answer.serverFee === "number" ) {
            return this._addServerConnected(socket, answer.serverFee);
        }

    }

    _addServerConnected(socket, fee){

        let server = this._findConnectedServer(socket);
        if (server !== null) return server;

        this.connectedServers.push(new PoolConnectedServer(socket, fee));
        return this.connectedServers[this.connectedServers.length-1];
    }

    _findConnectedServer(socket){

        for (let i=0; i<this.connectedServers.length; i++)
            if (this.connectedServers[i].socket === socket)
                return this.connectedServers[i];

        return null;
    }

    _deleteConnectedServer(socket){

        for (let i=0; i<this.connectedServers.length; i++)
            if (this.connectedServers[i] === socket) {
                this.connectedServers.splice(i, 1);
                return;
            }
    }

}

export default PoolConnectedServersProtocol;