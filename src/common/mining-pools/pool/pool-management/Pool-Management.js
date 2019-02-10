import PoolSettings from "./Pool-Settings";
import PoolData from 'common/mining-pools/pool/pool-management/pool-data/Pool-Data';
import consts from 'consts/const_global';
import PoolWorkManagement from "./pool-work/Pool-Work-Management";
import PoolProtocol from "./protocol/Pool-Protocol"
import PoolStatistics from "./pool-statistics/Pool-Statistics";
import StatusEvents from "common/events/Status-Events";
import Blockchain from "main-blockchain/Blockchain";
import PoolRewardsManagement from "./pool-work/rewards/Pool-Rewards-Management";
import PoolRemainingRewards from "./pool-work/rewards/Payout/Pool-Process-Remaining-Payment"
/*
 * Miners earn shares until the pool finds a block (the end of the mining round).
 * After that each user gets reward R = B * n / N,
 * where n is amount of his own shares,
 * and N is amount of all shares in this round.
 * In other words, all shares are equal, but its cost is calculated only in the end of a round.
 */

class PoolManagement{

    constructor(blockchain, wallet, databaseName){

        this.blockchain = blockchain;

        this.poolSettings = new PoolSettings(wallet, this);
        this.poolWorkManagement = new PoolWorkManagement( this, blockchain );
        this.poolProtocol = new PoolProtocol( this );
        this.poolData = new PoolData(this, databaseName);
        this.poolStatistics = new PoolStatistics( this );

        this.poolRewardsManagement = new PoolRewardsManagement(this, this.poolData, blockchain);
        this.poolRemainingRewards = new PoolRemainingRewards(this, this.poolData, blockchain);

        this._poolInitialized = false;
        this._poolOpened = false;
        this._poolStarted = false;

    }

    async initializePoolManagement(poolFee){

        let answer;

        try {
            answer = await this.poolSettings.initializePoolSettings(poolFee);

            console.info("The url is just your domain: " + this.poolSettings.poolURL);

            answer = await this.poolData.initializePoolData();

            answer = await this.poolStatistics.initializePoolStatistics();

            if (!answer)
                throw {message: "Pool Couldn't be started"};

        } catch (exception){
            console.error("Couldn't initialize a Pool", exception);
        }

        this.poolInitialized = true;

        return answer;

    }

    async startPool( forceStartPool = false ){

        if (this.poolSettings.poolURL && this.poolSettings.poolURL !== '' )
            return await this.setPoolStarted(true, forceStartPool);
        else
            console.error("Couldn't start the Pool because the poolURL is empty");

        return false
    }

    generatePoolWork(minerInstance){
        return this.poolWorkManagement.getWork(minerInstance);
    }

    receivePoolWork(minerInstance, work){
        return this.poolWorkManagement.poolWorkValidation.pushWorkForValidation(minerInstance, work)
    }

    /**
     * Update rewards for all miners. This function must be called at every block reward
     * @param newReward is the total new reward of the pool
     */
    updateRewards() {
        return this.poolData.updateRewards();
    }

    /**
     * Send rewards for miners and reset rewards from storage
     */
    sendRewardsToMiners() {
        return this.poolRewardsManagement.poolPayouts.doPayout();
    }




    get poolOpened(){
        return this._poolOpened;
    }

    get poolInitialized(){
        return this._poolInitialized;
    }

    get poolStarted(){
        return this._poolStarted;
    }

    set poolInitialized(value){
        this._poolInitialized = value;
        StatusEvents.emit("pools/status", {result: value, message: "Pool Initialization changed" });
    }

    set poolOpened(value){
        this._poolOpened = value;
        StatusEvents.emit("pools/status", {result: value, message: "Pool Opened changed" });
    }

    async setPoolStarted(value, forceStartPool = false){

        if (this._poolStarted !== value){

            if (value && forceStartPool){

                await Blockchain.MinerPoolManagement.setMinerPoolStarted(false);

                if (Blockchain.ServerPoolManagement !== undefined)
                    await Blockchain.ServerPoolManagement.setServerPoolStarted(false);

            }

            this._poolStarted = value;

            await this.poolSettings.setPoolActivated( value);

            if (value) {

                this.poolStatistics.startInterval();
                await this.poolProtocol._startPoolProtocol();

                if (this.blockchain && this.blockchain.prover )
                    this.blockchain.prover.proofActivated = false;

                await this.poolProtocol.poolConnectedServersProtocol.insertServersListWaitlist( this.poolSettings._poolServers );
                consts.MINING_POOL.MINING_POOL_STATUS = consts.MINING_POOL_TYPE.MINING_POOL;

                this.poolData.connectedMinerInstances.startPoolDataConnectedMinerInstances();

                Blockchain.PoolManagement.poolSettings.printPoolSettings();

                this.poolWorkManagement.startPoolWorkManagement();
            }
            else {

                await this.poolProtocol._stopPoolProtocol();
                this.poolStatistics.clearInterval();

                if (this.blockchain && this.blockchain.prover )
                    this.blockchain.prover.proofActivated = true;

                consts.MINING_POOL.MINING_POOL_STATUS = consts.MINING_POOL_TYPE.MINING_POOL_DISABLED;

                this.poolData.connectedMinerInstances.stopPoolDataConnectedMinerInstances();

                this.poolWorkManagement.stopPoolWorkManagement();
            }

            StatusEvents.emit("pools/status", {result: value, message: "Pool Started changed" } );

        }
    }

}

export default PoolManagement;