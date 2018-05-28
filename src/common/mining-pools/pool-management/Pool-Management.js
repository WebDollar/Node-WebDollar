import PoolSettings from "./Pool-Settings"
import PoolData from 'common/mining-pools/pool-management/pool-data/Pool-Data';
import consts from 'consts/const_global';
import PoolWorkManagement from "./Pool-Work-Management";

class PoolManagement{

    constructor(blockchain, wallet, databaseName){

        this.blockchain = blockchain;

        this.poolSettings = new PoolSettings(wallet);
        this.poolWorkManagement = new PoolWorkManagement(blockchain);

        // this.blockchainReward = BlockchainMiningReward.getReward();
        this._baseHash = new Buffer(consts.MINING_POOL.BASE_HASH_STRING, "hex");

        this._poolData = new PoolData(databaseName);

        //TODO: Check is needed to store/load from database
        this._poolLeaderReward = 0;

        this._resetMinedBlockStatistics();

    }

    async initializePoolManagement(){

        await this.poolSettings.initializePoolSettings();

    }

    generatePoolWorker(minerInstance){
        return this.poolWorkManagement.getWork(minerInstance);
    }

    receivePoolWork(work){

        if (work === undefined) return;

    }

    /**
     * Update rewards for all miners. This function must be called at every block reward
     * @param newReward is the total new reward of the pool
     */
    updateRewards(newReward) {

        let newLeaderReward = Math.floor( newReward * PoolManagement.poolLeaderFee / 100);
        this._poolLeaderReward += newLeaderReward;

        let minersReward = newReward - newLeaderReward;

        let response = this.computeHashDifficulties();
        let difficultyList = response.difficultyList;
        let difficultySum = response.sum;
        let rewardPerDifficultyLevel =  minersReward / difficultySum;

        //update rewards for each miner
        for (let i = 0; i < difficultyList.length; ++i) {
            let incReward = rewardPerDifficultyLevel * difficultyList[i];
            this._poolData.increaseMinerRewardById(i, incReward);
        }

    }

    /**
     * Do a transaction from reward wallet to miner's address
     */
    static sendReward(miner) {

        let minerAddress = miner.address;
        let reward = miner.reward;

        //TODO: Do the transaction
    }

    /**
     * Send rewards for miners and reset rewards from storage
     */
    async sendRewardsToMiners() {

        let minersList = this._poolData.getMinersList();

        for (let i = 0; i < minersList.length; ++i) {
            this.sendReward(minersList[i]);
        }

        //After sending rewards we must reset rewards
        await this._poolData.resetRewards();
    }

    /**
     * Pool has mined a new block and has received a new reward.
     * The new reward must be shared with miners.
     * @param newReward
     */
    async onMinedBlock(newReward) {

        this._logMinedBlockStatistics();

        this.updateRewards(newReward);
        await this.sendRewardsToMiners();

    }

    /**
     * This function updates the mining statistics for the last mined blocks.
     * The PoolData class manages the statistics
     */
    _logMinedBlockStatistics() {

        this._poolData.addMinedBlockStatistics( this._currentBlockStatistics );
        this._resetMinedBlockStatistics();
    }

    _resetMinedBlockStatistics() {
        /**
         * To be able to mine a block, the pool should generate ~ numBaseHashes of difficulty baseHashDifficulty
         * In other words: The arithmetic mean of all generated hashes by pool to mine a block should be
         * equal with numBaseHashes * baseHashDifficulty
         * Each miner will receive a reward wighted on the number of baseHashDifficulty sent to pool leader.
         */
        this._currentBlockStatistics = {
            baseHashDifficulty: Buffer.from(this._baseHash),
            numBaseHashes: 0
        };
    }

    /**
     * Reset the rewards that must be sent(pool leader + miners)
     */
    async resetRewards() {

        this._poolLeaderReward = 0;
        await this._poolData.resetRewards();
    }


    /**
     * @returns pool leader's reward
     */
    getPoolLeaderReward() {

        return this._poolLeaderReward;
    }

    /**
     * @returns pool's miner list
     */
    getMinersList() {

        return this._poolData.getMinersList();
    }

    createMinerTask() {

        //To create miner task puzzle

    }


}

export default PoolManagement;