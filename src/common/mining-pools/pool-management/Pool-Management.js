import PoolSettings from "./Pool-Settings";
import PoolData from 'common/mining-pools/pool-management/pool-data/Pool-Data';
import consts from 'consts/const_global';
import PoolWorkManagement from "./Pool-Work-Management";
import BufferExtended from "common/utils/BufferExtended"

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

        this.poolSettings = new PoolSettings(wallet);
        this.poolWorkManagement = new PoolWorkManagement(this, blockchain);

        // this.blockchainReward = BlockchainMiningReward.getReward();
        this._baseHash = new Buffer(consts.MINING_POOL.BASE_HASH_STRING, "hex");

        this.poolData = new PoolData(databaseName);

        this._resetMinedBlockStatistics();

    }

    async initializePoolManagement(){

        await this.poolSettings.initializePoolSettings();

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

        for (let i=0; i < this.poolData.miners.length; i++ ){


        }

    }

    /**
     * Do a transaction from reward wallet to miner's address
     */
    static sendReward(miner) {

        let minerAddress = miner.address;
        let reward = miner.reward;

        //TODO: Do the transaction

        return true;
    }

    /**
     * Send rewards for miners and reset rewards from storage
     */
    async sendRewardsToMiners() {

        for (let i = 0; i < this.poolData.miners.length; ++i) {
            this.sendReward(this.poolData.miners[i]);
        }

        //After sending rewards we must reset rewards
        await this.poolData.resetRewards();

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



}

export default PoolManagement;