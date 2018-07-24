import ServerPoolData from "./server-pool-data/Server-Pool-Data"
import ServerPoolSettings from "./Server-Pool-Settings"
import ServerPoolProtocol from "./protocol/Server-Pool-Protocol"

import NodeServer from 'node/sockets/node-server/sockets/Node-Server';
import StatusEvents from "common/events/Status-Events";
import Blockchain from "main-blockchain/Blockchain";
import consts from 'consts/const_global'

class ServerPoolManagement{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.serverPoolData = new ServerPoolData(this );
        this.serverPoolSettings = new ServerPoolSettings(this, );
        this.serverPoolProtocol = new ServerPoolProtocol( this );

        this.serverPoolSettings = new ServerPoolSettings(this);

        this._serverPoolOpened = false;
        this._serverPoolInitialized = false;
        this._serverPoolStarted = false;

    }

    async initializeServerPoolManagement(serverPoolFee){

        if ( false === await this.serverPoolData.loadServerPoolsList() )
            throw {message: "loadPoolsList failed"};

        if ( false === await this.serverPoolSettings.initializeServerPoolSettings())
            throw {message: "loadServer didn't work"};

        if (serverPoolFee !== undefined && typeof serverPoolFee === "number")
            await this.serverPoolSettings.setServerPoolFee(serverPoolFee);

        this.serverPoolInitialized = true;

        return true;

    }

    async startServerPool(forceServerPool=false){

        await this.setServerPoolStarted(true, forceServerPool);

        console.info("The url is just your domain: "+ NodeServer.getServerHTTPAddress() );

    }


    get serverPoolOpened(){
        return this._serverPoolOpened;
    }

    get serverPoolInitialized(){
        return this._serverPoolInitialized;
    }

    get serverPoolStarted(){
        return this._serverPoolStarted;
    }

    set serverPoolInitialized(value){
        this._serverPoolInitialized = value;
        StatusEvents.emit("server-pool/status", {result: value, message: "Server Pool Initialization changed" });
    }

    set serverPoolOpened(value){
        this._serverPoolOpened = value;
        StatusEvents.emit("server-pool/status", {result: value, message: "Server Pool Opened changed" });
    }

    async setServerPoolStarted(value, forceStartServerPool){

        if (this._serverPoolStarted !== value){

            if (value && forceStartServerPool){

                await Blockchain.MinerPoolManagement.setMinerPoolStarted(false);
                await Blockchain.PoolManagement.setPoolStarted(false);

            }

            this._serverPoolStarted = value;

            await this.serverPoolSettings.setServerPoolActivated(value);

            if (value){

                if (this.blockchain !== undefined &&  this.blockchain.prover !== undefined)
                    this.blockchain.prover.proofActivated = false;

                await this.serverPoolProtocol._startServerPoolProtocol();
                consts.MINING_POOL.MINING_POOL_STATUS = consts.MINING_POOL_TYPE.MINING_POOL_SERVER;
            }
            else {

                if (this.blockchain !== undefined && this.blockchain.prover !== undefined)
                    this.blockchain.prover.proofActivated = true;

                await this.serverPoolProtocol._stopServerPoolProtocol();
                consts.MINING_POOL.MINING_POOL_STATUS = consts.MINING_POOL_TYPE.MINING_POOL_DISABLED;
            }

            StatusEvents.emit("server-pool/status", {result: value, message: "Server Pool Started changed" });

        }
    }

}

export default ServerPoolManagement;