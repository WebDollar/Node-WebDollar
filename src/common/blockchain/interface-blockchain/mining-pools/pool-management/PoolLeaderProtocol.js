const BigNumber = require('bignumber.js');
const BigInteger = require('big-integer');

import consts from 'consts/const_global';
import NodesList from 'node/lists/nodes-list';
import PoolData from 'common/blockchain/interface-blockchain/mining-pools/pool-management/PoolData';
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';


class PoolLeaderProtocol {

    constructor(dataBase = consts.DATABASE_NAMES.POOL_DATABASE, poolLeaderFee = 5) {

        NodesList.emitter.on("nodes-list/connected", (result) => {
            this._subscribeMiner(result)
        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeMiner(result)
        });

        // this.blockchainReward = BlockchainMiningReward.getReward();
        this.difficultyTarget = new Buffer("00978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", "hex"); //target difficulty;

        this.poolData = new PoolData(dataBase);
        
        this._poolLeaderFee = poolLeaderFee;

        //TODO: Check is needed to store/load from database
        this.leaderReward = new BigNumber(0);

        //TODO: Check is needed to store/load from database, Update hardcoded value
        this._bestHash = new Buffer("00978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", "hex");

        //TODO: create an address which will be used to store miners reward
        this.rewardsAddress = null;
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

            let higherHash = this.getHigherHashDifficulty(data);

            this.poolHigherHashesList(higherHash, data.address);

        });

    }

    _unsubscribeMiner(nodesListObject) {

        let socket = nodesListObject.socket;
    }

    poolHigherHashesList(hash, minerAddress) {

        let higherHashList;

    }

    setMinnersRewardPrecentage() {


    }

    /**
     * Divides 2 big integers
     * @param divident is BigInteger
     * @param divisor is BigInteger
     * @returns {number}
     */
    divideBigInteger(divident, divisor) {

        let result = 1;
        let X = new BigInteger(divisor);

        //TODO: binary search for result
        while(X.compare(divident) < 0) {
            X = X.plus(divisor);
            result++;
        }

        return result;
    }

    /**
     * Compute and set best hash from miners
     * @returns {*} the new computed best hash
     */
    computeBestHash() {

        let minersList = this.poolData.getMinersList();

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

        let bestHashNumber = new BigInteger(this._bestHash.toString('hex'), 16);
        let minersList = this.poolData.getMinersList();
        let difficultyList = [];
        let sum = 0;

        for (let i = 0; i < minersList.length; ++i) {
            let currentHash = new BigInteger(minersList[i].bestHash.toString('hex'), 16);
            difficultyList[i] = this.divideBigInteger(bestHashNumber, currentHash);

            sum += difficultyList[i];
        }

        return {list: difficultyList, sum: sum};
    }

    /**
     * Update rewards for all miners. This function must be called at every block reward
     * @param newReward is the total new reward of the pool
     */
    updateRewards(newReward) {

        let leadReward = newReward.mul(100 - this._poolLeaderFee).dividedBy(100);
        this.leaderReward = this.leaderReward.plus(leadReward);

        let minersReward = newReward.minus(leadReward);

        let response = this.computeHashDifficulties();
        let difficultyList = response.list;
        let difficultySum = response.sum;
        let rewardPerDifficultyLevel = new BigNumber(minersReward.dividedBy(difficultySum));

        //update rewards for each miner
        for (let i = 0; i < difficultyList.length; ++i) {
            let incReward = new BigNumber(rewardPerDifficultyLevel.mul(difficultyList[i]));
            this.poolData.increaseMinerRewardById(i, incReward);
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

        let minersList = this.poolData.getMinersList();

        for (let i = 0; i < minersList.length; ++i) {
            this.sendReward(minersList[i]);
        }

        //After sending rewards we must reset rewards
        await this.poolData.resetRewards();
    }

    /**
     * Pool has received a new reward. It must send rewards to miners
     * @param newReward
     */
    async receiveNewPoolRewardFromBlockchain(newReward) {

        this.updateRewards(newReward);
        await this.sendRewardsToMiners();

    }
    
    /**
     * Insert a new miner if not exists. Synchronizes with DB.
     * @param minerAddress
     * @returns true/false
     */
    addMiner(minerAddress) {
        
        return this.poolData.setMiner(minerAddress);
    }
    
    /**
     * Remove a miner if exists. Synchronizes with DB.
     * @param minerAddress
     * @returns true/false 
     */
    removeMiner(minerAddress) {
        
        return this.poolData.removeMiner(minerAddress);
    }

    /**
     * Set poolLeaderFee in percentage
     * @param fee
     */
    setPoolLeaderFee(fee) {
        this._poolLeaderFee = fee;
    }

    /**
     * @returns the poolLeader's fee
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
     * @returns the pool's best hash
     */
    getBestHash() {

        return this._bestHash;
    }

    createMinerTask() {

        //To create miner task puzzle

    }

}

export default PoolLeaderProtocol;