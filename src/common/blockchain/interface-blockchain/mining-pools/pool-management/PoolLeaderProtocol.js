import NodesList from 'node/lists/nodes-list';
import PoolData from 'common/blockchain/interface-blockchain/mining-pools/pool-management/PoolData';

import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';

const BigNumber = require('bignumber.js');
const BigInteger = require('big-integer');

class PoolLeaderProtocol {

    constructor(dataBase) {

        NodesList.emitter.on("nodes-list/connected", (result) => {
            this._subscribeMiner(result)
        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeMiner(result)
        });

        // this.blockchainReward = BlockchainMiningReward.getReward();
        this.difficultyTarget = new Buffer("00978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", "hex"); //target difficulty;

        this.poolData = new PoolData(dataBase);

        //TODO: Check is needed to store/load from database
        this.leaderReward = new BigNumber(0);

        //TODO: Check is needed to store/load from database, Update hardcoded value
        this.bestHash = new Buffer("00978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", "hex");
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

    createMinerTask() {

        //To create miner task puzzle

    }

    poolHigherHashesList(hash, minerAddress) {

        let higherHashList;

    }

    setMinnersRewardPrecentage() {


    }

    /**
     * Divides 2 big integers
     * @param divident
     * @param divisor
     * @returns {number}
     */
    static divideBigInteger(divident, divisor) {

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
     * Updates and returns besh hash from miners
     * @returns {*} best hash from miners
     */
    updateBeshHash() {

        let minersList = this.poolData.getMinersList();
        let bestHash = minersList[0].beshHash;

        for (let i = 1; i < minersList.length; ++i) {
            if (bestHash.compare(minersList[i].bestHash) < 0)
                bestHash = minersList[i].bestHash;
        }

        return bestHash;
    }

    /**
     * Calculate difficulty for all miner's hashed. Each miner hash associated a hash difficulty number
     * @returns {*}
     */
    computeHashDifficulties() {

        let hashTargetNumber = new BigInteger(this.bestHash.toString('hex'), 16);
        let minersList = this.poolData.getMinersList();
        let difficultyList = [];
        let sum = 0;

        for (let i = 0; i < minersList.length; ++i) {
            let currentHash = new BigInteger(minersList[i].hash.toString('hex'), 16);
            difficultyList[i] = this.divideBigInteger(hashTargetNumber, currentHash);

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
     * Send rewards for miners and reset rewards from storage
     */
    sendRewardsToMiners() {

    }

    // Budisteanu's formula
    getMinerReward(bestHash, hashTarget, reward, numberHashedLastTime) {

        bestHash = new BigInteger(bestHash.toString('hex'), 16);
        hashTarget = new BigInteger(hashTarget.toString('hex'), 16);

        let difficulty = new BigNumber(bestHash).dividedBy(hashTarget);
        let rewardForHashes = new BigNumber(reward).dividedBy(numberHashedLastTime);
        let result = new BigNumber(difficulty).mul(rewardForHashes);

        return result.toString();

    }

    getPoolRewardFromBlockchain(reward) {

        let poolLeaderFee = this.getPoolLeaderFee();
        let newRewardDistribution = this.updateRewards(reward, poolLeaderFee, hashList);

        this.poolData.updateMinersReward(newRewardDistribution.minnersReward);

        //To add pool leader reward

    }

    getPoolLeaderFee() {
        return this._poolLeaderFee;
    }

    setPoolLeaderFee(fee) {
        this._poolLeaderFee = fee;
    }

}

export default PoolLeaderProtocol;