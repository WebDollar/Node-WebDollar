import PoolSettings from "./Pool-Settings"
import PoolData from 'common/mining-pools/pool-management/pool-data/Pool-Data';
import consts from 'consts/const_global';

class PoolManagement{

    constructor(wallet, databaseName){

        this.poolSettings = new PoolSettings(wallet);

        // this.blockchainReward = BlockchainMiningReward.getReward();
        this._baseHash = new Buffer(consts.MINING_POOL.BASE_HASH_STRING, "hex");

        this._poolData = new PoolData(databaseName);

        //TODO: Check is needed to store/load from database
        this._poolLeaderReward = 0;

        //TODO: Check is needed to store/load from database, Update hardcoded value
        this._bestHash = new Buffer(consts.MINING_POOL.BASE_HASH_STRING, "hex");

        this._resetMinedBlockStatistics();

    }

    async initializePoolManagement(){

        await this.poolSettings.initializePoolSettings();

    }


    createPoolWorker(){

        return {
            block: new Buffer(32),
            noncesStart: 0,
            noncesEnd: 100,
        };

    }


    /**
     * Compute and set best hash from miners
     * @returns {*} the new computed best hash
     */
    computeBestHash() {

        let minersList = this._poolData.getMinersList();

        if (minersList.length === 0)
            return this._bestHash;

        let bestHash = minersList[0].bestHash;

        for (let i = 1; i < minersList.length; ++i) {
            if (bestHash.compare(minersList[i].bestHash) < 0)
                bestHash = minersList[i].bestHash;
        }

        this._bestHash = bestHash;

        return bestHash;
    }



    /**
     * Calculate difficulty for all miner's hashed.
     * Each miner has associated a bestHash difficulty number
     * @returns {*} difficultyList of miners and sum(difficultyList)
     */
    computeHashDifficulties() {

        this.computeBestHash();
        this.computeWorstHash();

        let minersList = this._poolData.getMinersList();

        let bestHashInt = Convert.bufferToBigIntegerHex(this._bestHash);
        let worstHashInt = Convert.bufferToBigIntegerHex(this._worstHash);

        let difficultyList = [];
        let sum = 0;

        for (let i = 0; i < minersList.length; ++i) {
            let currentHashInt = Convert.bufferToBigIntegerHex(minersList[i].bestHash);
            difficultyList[i] = Utils.divideBigIntegers(bestHashInt, currentHashInt);

            sum += difficultyList[i];
        }

        return {difficultyList: difficultyList, sum: sum};
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
     * Set pool's best hash
     * @param fee
     */
    setBestHash(bestHash) {

        this._bestHash = bestHash;
    }

    /**
     * @returns pool's best hash
     */
    getBestHash() {

        return this._bestHash;
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