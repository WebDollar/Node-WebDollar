import PoolSettings from "./Pool-Settings";
import PoolData from 'common/mining-pools/pool/pool-management/pool-data/Pool-Data';
import consts from 'consts/const_global';
import PoolWorkManagement from "./Pool-Work-Management";
import PoolProtocol from "./protocol/Pool-Protocol"
import StatusEvents from "common/events/Status-Events";
import Blockchain from "../../../../main-blockchain/Blockchain";
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
        this.poolWorkManagement = new PoolWorkManagement( this );
        this.poolProtocol = new PoolProtocol( this );

        this._poolInitialized = false;
        this._poolOpened = false;
        this._poolStarted = false;

        // this.blockchainReward = BlockchainMiningReward.getReward();

        this.poolData = new PoolData(this, databaseName);

    }

    async initializePoolManagement(poolFee){

        let answer = await this.poolSettings.initializePoolSettings(poolFee);
        console.info("The url is just your domain: "+ this.poolSettings.poolURL);

        if (!answer ){
            throw {message: "Pool Couldn't be started"};
            return false;
        }

        if (this.poolSettings.poolURL !== '' && this.poolSettings.poolURL !== undefined)
            this.poolOpened = true;
        else {
            console.error("Couldn't start MinerPool");
            return false;
        }

        return answer;

    }

    async startPool( forceStartMinerPool = false ){

        if (this.poolSettings.poolURL !== '' && this.poolSettings.poolURL !== undefined)
            return await this.setPoolStarted(true, forceStartMinerPool);
        else
            console.error("Couldn't start the Pool because the poolURL is empty");

        return false
    }

    generatePoolWork(minerInstance){
        return this.poolWorkManagement.getWork(minerInstance);
    }

    receivePoolWork(minerInstance, work){
       return this.poolWorkManagement.processWork(minerInstance, work)
    }

    /**
     * Update rewards for all miners. This function must be called at every block reward
     * @param newReward is the total new reward of the pool
     */
    updateRewards() {
        return this.poolData.updateRewards();
    }

    /**
     * Do a transaction from reward wallet to miner's address
     */
    static sendReward(miner) {

        let minerAddress = miner.address;
        let reward = miner.reward;

        //TODO: Do the transaction

        //TODO: clear the poolTransaction

        return true;
    }

    /**
     * Send rewards for miners and reset rewards from storage
     */
    async sendRewardsToMiners() {
        for (let i = 0; i < this.poolData.miners.length; ++i)
            await this.sendReward(this.poolData.miners[i]);
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

            await this.poolSettings.setPoolActivated(value);

            if (value) await this.poolProtocol._startPoolProtocol();
            else await this.poolProtocol._stopPoolProtocol();

            StatusEvents.emit("pools/status", {result: value, message: "Pool Started changed" });

        }
    }

}

export default PoolManagement;