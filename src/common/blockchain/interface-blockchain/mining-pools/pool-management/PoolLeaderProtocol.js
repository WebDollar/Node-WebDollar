const BigInteger = require('big-integer');

import consts from 'consts/const_global';
import Convert from 'common/utils/Convert';
import NodesList from 'node/lists/nodes-list';
import PoolData from 'common/blockchain/interface-blockchain/mining-pools/pool-management/PoolData';
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';

/*
 * Miners earn shares until the pool finds a block (the end of the mining round).
 * After that each user gets reward R = B * n / N, 
 * where n is amount of his own shares,
 * and N is amount of all shares in this round. 
 * In other words, all shares are equal, but its cost is calculated only in the end of a round.
 */
class PoolLeaderProtocol {

    constructor(poolLeaderFee = 5, databaseName = consts.DATABASE_NAMES.POOL_DATABASE) {

        NodesList.emitter.on("nodes-list/connected", (result) => {
            this._subscribeMiner(result)
        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeMiner(result)
        });

        // this.blockchainReward = BlockchainMiningReward.getReward();
        this._baseHash = new Buffer(consts.MINING_POOL.BASE_HASH_STRING, "hex");

        this._poolData = new PoolData(databaseName);
        
        // is the fee percent that the pool leader receives for each mined block
        this._poolLeaderFee = poolLeaderFee;

        //TODO: Check is needed to store/load from database
        this._poolLeaderReward = 0;

        //TODO: Check is needed to store/load from database, Update hardcoded value
        this._bestHash = new Buffer("00978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", "hex");

        //TODO: this stores the entire reward of pool(miners + poolLeader), this goes to Accountant Tree
        this._poolRewardsAddress = null;
        
        //TODO: this stores pool leader's reward, this goes to Accountant Tree
        this._poolLeaderRewardAddress = null;
        
        this._resetMinedBlockStatistics();
    }

    _subscribeMiner(nodesListObject) {

        let socket = nodesListObject.socket;

        socket.node.sendRequest("mining-pool-protocol/create-minner-task", (data) => {

            try {
                this.createMinerTask();
            } catch (exception) {

                console.log("Failed to send task to minner");
            }

        });

        socket.node.on("mining-pool-protocol/get-minner-work", (data) => {

                try {

                    let higherHash = this.getHigherHashDifficulty(data);

                    this.poolHigherHashesList(higherHash, data.address);

                } catch (exception){

                }

        });

    }

    _unsubscribeMiner(nodesListObject) {

        let socket = nodesListObject.socket;
    }

    /**
     * Divides 2 big integers
     * @param divident is BigInteger
     * @param divisor is BigInteger
     * @returns {number}
     */
    divideBigIntegers(divident, divisor) {

        let result = 1;
        let X = new BigInteger(divisor);

        //TODO: binary search for result
        while(X.compare(divident) <= 0) {
            X = X.plus(divisor);
            result++;
        }

        return result - 1;
    }
    
    /**
     * Compute and set worst hash from miners
     * @returns {*} the new computed worst hash
     */
    computeWorstHash() {

        let minersList = this._poolData.getMinersList();

        if (minersList.length === 0)
            return this._worstHash;
        
        let worstHash = minersList[0].bestHash;

        for (let i = 1; i < minersList.length; ++i) {
            if (worstHash.compare(minersList[i].bestHash) > 0)
                worstHash = minersList[i].bestHash;
        }
        
        this._worstHash = worstHash;

        return worstHash;
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
            difficultyList[i] = this.divideBigIntegers(bestHashInt, currentHashInt);

            sum += difficultyList[i];
        }

        return {difficultyList: difficultyList, sum: sum};
    }

    /**
     * Update rewards for all miners. This function must be called at every block reward
     * @param newReward is the total new reward of the pool
     */
    updateRewards(newReward) {

        let newLeaderReward = Math.floor( newReward * this._poolLeaderFee / 100);
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
     * Insert a new miner if not exists. Synchronizes with DB.
     * @param minerAddress
     * @returns true/false
     */
    addMiner(minerAddress) {
        
        return this._poolData.setMiner(minerAddress);
    }
    
    /**
     * Remove a miner if exists. Synchronizes with DB.
     * @param minerAddress
     * @returns true/false 
     */
    removeMiner(minerAddress) {
        
        return this._poolData.removeMiner(minerAddress);
    }
    
    /**
     * Reset the rewards that must be sent(pool leader + miners)
     */
    async resetRewards() {
        
        this._poolLeaderReward = 0;
        await this._poolData.resetRewards();
    }

    /**
     * Set poolLeaderFee in percentage
     * @param fee
     */
    setPoolLeaderFee(fee) {
        this._poolLeaderFee = fee;
    }

    /**
     * @returns poolLeader's fee
     */
    getPoolLeaderFee() {
        return this._poolLeaderFee;
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

export default PoolLeaderProtocol;