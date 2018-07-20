import consts from "consts/const_global";

import MinerPoolMining from "common/mining-pools/miner/mining/Miner-Pool-Mining";
import MinerPoolReward from "common/mining-pools/miner/mining/Miner-Pool-Reward";
import MinerPoolStatistics from "common/mining-pools/miner/pool-statistics/Miner-Pool-Statistics"
import MinerPoolProtocol from "common/mining-pools/miner/protocol/Miner-Pool-Protocol"
import MinerPoolSettings from "common/mining-pools/miner/Miner-Pool-Settings"
import StatusEvents from "common/events/Status-Events";
import Blockchain from "main-blockchain/Blockchain";
import NodesList from 'node/lists/Nodes-List'

class MinerProtocol {

    constructor (blockchain){

        this.blockchain = blockchain;

        //this stores the last sent hash

        this.minerPoolSettings = new MinerPoolSettings(this);
        this.minerPoolProtocol = new MinerPoolProtocol(this);
        this.minerPoolStatistics = new MinerPoolStatistics(this);
        
        this.minerPoolMining = new MinerPoolMining(this);
        this.minerPoolReward = new MinerPoolReward(this);

        this._minerPoolInitialized = false;
        this._minerPoolOpened = false;
        this._minerPoolStarted = false;

    }

    async initializeMinerPoolManagement(poolURL){

        let answer = await this.minerPoolSettings.initializeMinerPoolSettings(poolURL);

        this.minerPoolInitialized = true;

        return answer;
    }

    async startMinerPool(poolURL, forceStartMinerPool = false ){

        if ( poolURL === false){
            await this.setMinerPoolStarted(false);
            return;
        }

        if (poolURL !== undefined)
            await this.minerPoolSettings.setPoolURL(poolURL);

        if (this.minerPoolSettings.poolURL !== undefined && this.minerPoolSettings.poolURL !== '') {
            return await this.setMinerPoolStarted(true, forceStartMinerPool);
        }
        else {
            console.error("Couldn't start MinerPool");
            return false;
        }

    }


    get minerPoolOpened(){
        return this._minerPoolOpened;
    }

    get minerPoolInitialized(){
        return this._minerPoolInitialized;
    }

    get minerPoolStarted(){
        return this._minerPoolStarted;
    }

    set minerPoolInitialized(value){
        this._minerPoolInitialized = value;
        StatusEvents.emit("miner-pool/status", {result: value, message: "Miner Pool Initialized changed" });
    }

    set minerPoolOpened(value){
        this._minerPoolOpened = value;
        StatusEvents.emit("miner-pool/status", {result: value, message: "Miner Pool Opened changed" });
    }

    async setMinerPoolStarted(value, forceStartMinerPool = false){

        if (this._minerPoolStarted !== value){

            if (value && forceStartMinerPool){
                await Blockchain.PoolManagement.setPoolStarted(false);

                if (Blockchain.ServerPoolManagement !== undefined)
                    await Blockchain.ServerPoolManagement.setServerPoolStarted(false);
            }

            this._minerPoolStarted = value;

            await this.minerPoolSettings.setMinerPoolActivated(value);

            NodesList.disconnectAllNodes("all");

            if (value) {

                Blockchain.blockchain.miningSolo.stopMining();

                this.blockchain.mining = this.minerPoolMining;
                Blockchain.Mining = this.minerPoolMining;

                this.blockchain.agent.consensus = false;

                await this.minerPoolProtocol.insertServersListWaitlist( this.minerPoolSettings.poolServers );
                await this.minerPoolProtocol._startMinerProtocol();
                await this.minerPoolMining._startMinerPoolMining();

                consts.MINING_POOL.MINING_POOL_STATUS = consts.MINING_POOL_TYPE.MINING_POOL_MINER;
            }
            else {

                Blockchain.blockchain.miningSolo.stopMining();

                this.blockchain.mining = Blockchain.blockchain.miningSolo;
                Blockchain.Mining = Blockchain.blockchain.miningSolo;

                await this.minerPoolProtocol._stopMinerProtocol();
                await this.minerPoolMining._stopMinerPoolMining();

                this.blockchain.blocks.length  = 0;
                this.blockchain.agent.consensus = true;

                consts.MINING_POOL.MINING_POOL_STATUS = consts.MINING_POOL_TYPE.MINING_POOL_DISABLED;

            }

            StatusEvents.emit("miner-pool/status", {result: value, message: "Miner Pool Started changed" });

        }
    }


}

export default MinerProtocol;