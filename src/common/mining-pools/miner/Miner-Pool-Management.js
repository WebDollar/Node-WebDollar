import consts from "consts/const_global";

import MinerPoolMining from "./mining/Miner-Pool-Mining";
import MinerPoolReward from "./mining/Miner-Pool-Reward";
import MinerPoolStatistics from "./pool-statistics/Miner-Pool-Statistics"
import MinerPoolProtocol from "./protocol/Miner-Pool-Protocol"
import MinerPoolReferrals from "./Miner-Pool-Referrals"
import MinerPoolSettings from "./Miner-Pool-Settings"
import StatusEvents from "common/events/Status-Events";
import Blockchain from "main-blockchain/Blockchain";
import NodesList from 'node/lists/Nodes-List'
import Log from 'common/utils/logging/Log';
import NodeDiscoveryService from 'node/sockets/node-clients/service/discovery/Node-Clients-Discovery-Service'

class MinerProtocol {

    constructor (blockchain){

        this.blockchain = blockchain;

        //this stores the last sent hash

        this.minerPoolSettings = new MinerPoolSettings(this);
        this.minerPoolProtocol = new MinerPoolProtocol(this);
        this.minerPoolStatistics = new MinerPoolStatistics(this);
        this.minerPoolReferrals = new MinerPoolReferrals(this);
        
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

        try {

            if (poolURL === false) {
                await this.setMinerPoolStarted(false);
                return;
            }

            if (poolURL !== undefined)
                await this.minerPoolSettings.setPoolURL(poolURL);

            if (this.minerPoolSettings.poolURL !== undefined && this.minerPoolSettings.poolURL !== '') {
                this._minerPoolStarted = false;
                return await this.setMinerPoolStarted(true, forceStartMinerPool);
            }
            else {
                console.error("Couldn't start MinerPool");
                return false;
            }

        } catch (exception){
            Log.error("startMinerPool raised an error", Log.LOG_TYPE.POOLS, exception)
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

        try {

            if (this._minerPoolStarted !== value) {

                if (value && forceStartMinerPool) {
                    await Blockchain.PoolManagement.setPoolStarted(false);

                    if (Blockchain.ServerPoolManagement !== undefined)
                        await Blockchain.ServerPoolManagement.setServerPoolStarted(false);
                }

                this._minerPoolStarted = value;

                await this.minerPoolSettings.setMinerPoolActivated(value);

                NodesList.disconnectAllNodes("all");

                if (value) {

                    this.blockchain.mining = this.minerPoolMining;
                    Blockchain.Mining = this.minerPoolMining;

                    this.blockchain.agent.consensus = false;

                    if (this.blockchain !== undefined && this.blockchain.prover !== undefined)
                        this.blockchain.prover.proofActivated = false;

                    await this.minerPoolProtocol.insertServersListWaitlist(this.minerPoolSettings.poolServers);
                    await this.minerPoolMining._startMinerPoolMining();

                    if (!this.minerPoolMining.started) {
                        let workers;
                        if (Blockchain.blockchain.miningSolo.workers !== undefined) workers = Blockchain.blockchain.miningSolo.workers.workers;

                        Blockchain.blockchain.miningSolo.stopMining();
                        await this.minerPoolProtocol._startMinerProtocol();

                        if (workers !== undefined) this.minerPoolMining.setWorkers(workers);
                    }

                    await this.minerPoolReferrals.startLoadMinerPoolReferrals();

                    consts.MINING_POOL.MINING_POOL_STATUS = consts.MINING_POOL_TYPE.MINING_POOL_MINER;
                }
                else {

                    this.blockchain.mining = Blockchain.blockchain.miningSolo;
                    Blockchain.Mining = Blockchain.blockchain.miningSolo;

                    if (this.minerPoolMining.started) {
                        await this.minerPoolProtocol._stopMinerProtocol();

                        let workers;
                        if (this.minerPoolMining.workers !== undefined) workers = this.minerPoolMining.workers.workers;

                        await this.minerPoolMining._stopMinerPoolMining();
                        Blockchain.blockchain.miningSolo.startMining();

                        if (workers !== undefined) Blockchain.blockchain.miningSolo.setWorkers(workers);
                    }

                    await this.minerPoolReferrals.stopLoadMinerPoolReferrals();

                    this.blockchain.blocks.length = 0;
                    this.blockchain.agent.consensus = true;
                    this.minerPoolReward.totalReward = 0;
                    this.minerPoolReward.confirmedReward = 0;
                    this.minerPoolReward.totalReferralReward = 0;
                    this.minerPoolReward.confirmedReferralReward = 0;

                    NodeDiscoveryService.startDiscovery();

                    if (this.blockchain !== undefined && this.blockchain.prover !== undefined)
                        this.blockchain.prover.proofActivated = true;

                    consts.MINING_POOL.MINING_POOL_STATUS = consts.MINING_POOL_TYPE.MINING_POOL_DISABLED;

                }

                StatusEvents.emit("miner-pool/status", {result: value, message: "Miner Pool Started changed"});

            }

        } catch (exception){
            this._minerPoolStarted = false;
            Log.error("Error starting MinerPool", Log.LOG_TYPE.POOLS, exception);
        }
    }


}

export default MinerProtocol;